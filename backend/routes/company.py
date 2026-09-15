from fastapi import APIRouter, HTTPException, Depends, Form
from typing import Annotated
from pydantic import BaseModel
from datetime import datetime, date, time, timezone
from utils.security import verify_password
from utils.tokens import CREDENTIALS_EXCEPTION, issue_token, read_token
import dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from db_functions.access_table import get_supabase_client
import uuid
from helper.company.genworkflow import create_automated_interview_workflow, post_workflow
from helper.company.transcript import retrive_transcript, grade_transcript
import json
import logging
import requests
from utils.features import calls_enabled
from utils.quota import require_quota

dotenv.load_dotenv()

router = APIRouter(prefix="/company", tags=["company"])
logger = logging.getLogger(__name__)


class Company(BaseModel):
    id: int
    created_at: datetime
    username: str
    email: str
    disabled: bool

class CompanyInDB(Company):
    company_id: str
    hashed_password: str

class InterviewBasic(BaseModel):
    id: int
    created_at: datetime
    company_id: str
    candidate_name: str
    candidate_email: str | None = None
    candidate_phone: str
    position: str | None = None
    status: str
    interview_date: date | None = None
    interview_time: time | None = None
    call_id: str | None = None
    transcript: str | None = None
    ai_evaluation: str | None = None

class InterviewCredentials(BaseModel):
    candidate_name: str
    candidate_email: str
    position: str | None = None

class CompanyRole(BaseModel):
    title: str
    department: str | None = None
    description: str | None = None
    requirements: str | None = None

class CompanyRoleOut(CompanyRole):
    id: int
    created_at: datetime
    vapi_workflow_id: str | None = None


company_oatuh2_scheme = OAuth2PasswordBearer(tokenUrl="/api/company/token")
supabase = get_supabase_client()


def get_company(username: str) -> CompanyInDB | None:
    rows = supabase.table("company").select("*").eq("username", username).execute().data
    return CompanyInDB(**rows[0]) if rows else None


def authenticate_company(username: str, password: str) -> CompanyInDB | None:
    company = get_company(username)
    if not company or not verify_password(password, company.hashed_password):
        return None
    return company


async def get_current_company(token: Annotated[str, Depends(company_oatuh2_scheme)]) -> CompanyInDB:
    company = get_company(read_token(token, "company"))
    if not company:
        raise CREDENTIALS_EXCEPTION
    return company


async def get_current_active_company(
    current_company: Annotated[CompanyInDB, Depends(get_current_company)],
) -> CompanyInDB:
    if current_company.disabled:
        raise HTTPException(status_code=400, detail="Inactive company")
    return current_company


@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    company = authenticate_company(form_data.username, form_data.password)
    if not company:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"access_token": issue_token(company.username, "company"), "token_type": "bearer"}

@router.get("/", summary="Get company info", response_model=Company)
async def get_company_info(current_company: Annotated[Company, Depends(get_current_active_company)]):
    return current_company

def to_interview_basic(row: dict) -> InterviewBasic:
    evaluation = row.get("ai_evaluation")
    if isinstance(evaluation, dict):
        return InterviewBasic(**{**row, "ai_evaluation": json.dumps(evaluation)})
    return InterviewBasic(**row)


def get_owned_interview(interview_id: int, company: CompanyInDB) -> dict:
    rows = (
        supabase.table("interviews")
        .select("*")
        .eq("id", interview_id)
        .eq("company_id", company.company_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Interview not found")
    return rows[0]


@router.get("/interviews", summary="Get company interviews", response_model=list[InterviewBasic])
async def get_company_interviews(current_company: Annotated[CompanyInDB, Depends(get_current_active_company)]):
    rows = supabase.table("interviews").select("*").eq("company_id", current_company.company_id).execute().data
    return [to_interview_basic(row) for row in rows]


@router.get("/interviews/{interview_id}", summary="Get company interview", response_model=InterviewBasic)
async def get_company_interview(
    interview_id: int,
    current_company: Annotated[CompanyInDB, Depends(get_current_active_company)],
):
    return to_interview_basic(get_owned_interview(interview_id, current_company))

@router.post("/interviews", summary="Create company interview", response_model=InterviewBasic)
async def create_company_interview(
    current_company: Annotated[Company, Depends(get_current_active_company)],
    candidate_name: Annotated[str, Form()],
    candidate_phone: Annotated[str, Form()],
    candidate_email: Annotated[str, Form()] = "",
    position: Annotated[str, Form()] = "",
    date: Annotated[date, Form()] = None,
    time: Annotated[time, Form()] = None
):
    interview_data = {
        "company_id": str(uuid.UUID(current_company.company_id)),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "Pending",
        "candidate_name": candidate_name,
        "candidate_email": candidate_email.strip().lower() or None,
        "candidate_phone": candidate_phone,
        "position": position if position else None,
        "interview_date": date.isoformat() if date else None,
        "interview_time": time.isoformat() if time else None,
        "vapi_workflow_id": supabase.table("roles").select("vapi_workflow_id").eq("company_id", current_company.company_id).eq("title", position).execute().data[0]["vapi_workflow_id"] if supabase.table("roles").select("vapi_workflow_id").eq("company_id", current_company.company_id).eq("title", position).execute().data else None
    }
    interview_result = supabase.table("interviews").insert(interview_data).execute().data
    if interview_result:
        return InterviewBasic(**interview_result[0])
    else:
        raise HTTPException(status_code=400, detail="Failed to create interview")

@router.delete("/interviews/{interview_id}", summary="Delete company interview")
async def delete_company_interview(
    interview_id: int,
    current_company: Annotated[CompanyInDB, Depends(get_current_active_company)],
):
    get_owned_interview(interview_id, current_company)
    supabase.table("interviews").delete().eq("id", interview_id).eq("company_id", current_company.company_id).execute()
    return {"message": "Interview deleted successfully"}

@router.get("/roles", summary="Get company roles", response_model=list[CompanyRoleOut])
async def get_company_roles(current_company: Annotated[Company, Depends(get_current_active_company)]):
    roles = supabase.table("roles").select("*").eq("company_id", current_company.company_id).execute().data
    return [CompanyRoleOut(**role_dict) for role_dict in roles]

@router.get("/roles/{role_id}", summary="Get company role by ID", response_model=CompanyRoleOut)
async def get_company_role(
    role_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)]
):
    role_record = supabase.table("roles").select("*").eq("id", role_id).execute().data
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")
    if role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this role")
    return CompanyRoleOut(**role_record[0])

@router.post("/roles", summary="Create company role", response_model=CompanyRoleOut)
async def create_company_role(
    current_company: Annotated[Company, Depends(get_current_active_company)],
    role: CompanyRole
):
    role_data = {
        "company_id": str(uuid.UUID(current_company.company_id)),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "title": role.title,
        "description": role.description,
        "requirements": role.requirements,
        "department": role.department,
        "vapi_workflow_id": None
    }
    role_result = supabase.table("roles").insert(role_data).execute().data
    if role_result:
        return CompanyRoleOut(**role_result[0])
    else:
        raise HTTPException(status_code=400, detail="Failed to create role")

@router.put("/roles/{role_id}", summary="Update company role", response_model=CompanyRoleOut)
async def update_company_role(
    role_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)],
    role: CompanyRole,
):
    role_record = (
        supabase.table("roles").select("*").eq("id", role_id).execute().data
    )
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")
    if role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this role")

    update_data = {
        "title": role.title,
        "description": role.description,
        "requirements": role.requirements,
        "department": role.department,
    }
    updated = (
        supabase.table("roles").update(update_data).eq("id", role_id).execute().data
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update role")
    return CompanyRoleOut(**updated[0])

@router.delete("/roles/{role_id}", summary="Delete company role")
async def delete_company_role(
    role_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)],
):
    role_resp = (
        supabase.table("roles").select("company_id").eq("id", role_id).execute()
    )
    role_record = role_resp.data
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")
    if role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this role")

    q_del_resp = supabase.table("questions").delete().eq("role_id", role_id).execute()

    del_resp = supabase.table("roles").delete().eq("id", role_id).execute()
    if del_resp.data and len(del_resp.data) > 0:
        return {"message": "Role deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to delete role")
    
@router.post("/roles/{role_id}/create-workflow", summary="Create workflow for role")
async def create_workflow_for_company_role(
    role_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)],
):
    role_record = supabase.table("roles").select("*").eq("id", role_id).execute().data
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")
    if role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this role")
    questions = supabase.table("questions").select("question_text").eq("role_id", role_id).execute().data
    if not questions:
        raise HTTPException(status_code=404, detail="Questions not found")
    questions = [question["question_text"] for question in questions]
    if not calls_enabled():
        raise HTTPException(status_code=503, detail="Voice agent creation is turned off in this demo.")
    require_quota(supabase, "workflow")
    workflow = create_automated_interview_workflow(
        questions=questions,
        company_name=current_company.username,
        interviewer_name="Alex",
        name=f"{current_company.username}_{role_record[0]['title']}_Interview_Workflow",
        voice="andrew",
        model="gpt-4o",
        timeout_seconds=45
    )
    try:
        workflow_id = post_workflow(workflow)
    except (RuntimeError, requests.RequestException) as exc:
        logger.exception("Vapi workflow creation failed for role %s", role_id)
        raise HTTPException(
            status_code=502, detail="The voice agent provider rejected the request. Try again later."
        ) from exc
    supabase.table("roles").update({"vapi_workflow_id": workflow_id}).eq("id", role_id).execute()
    return {"vapi_workflow_id": workflow_id}

class QuestionBase(BaseModel):
    question_text: str
    question_type: str
    difficulty: str

class QuestionCreate(QuestionBase):
    role_id: int

class QuestionOut(QuestionBase):
    id: int
    role_id: int
    created_at: datetime

@router.post("/questions", summary="Create question", response_model=QuestionOut)
async def create_question(
    current_company: Annotated[Company, Depends(get_current_active_company)],
    question: QuestionCreate,
):
    role_record = (
        supabase.table("roles").select("*").eq("id", question.role_id).execute().data
    )
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")
    if role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this role")

    data = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role_id": question.role_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "difficulty": question.difficulty,
    }
    inserted = supabase.table("questions").insert(data).execute().data
    if not inserted:
        raise HTTPException(status_code=400, detail="Failed to create question")
    return QuestionOut(**inserted[0])

@router.put("/questions/{question_id}", summary="Update question", response_model=QuestionOut)
async def update_question(
    question_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)],
    question: QuestionBase,
):
    qrec = (
        supabase.table("questions").select("*").eq("id", question_id).execute().data
    )
    if not qrec:
        raise HTTPException(status_code=404, detail="Question not found")
    role_id = qrec[0]["role_id"]
    role_record = supabase.table("roles").select("*").eq("id", role_id).execute().data
    if not role_record or role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this question")

    update_data = {
        "question_text": question.question_text,
        "question_type": question.question_type,
        "difficulty": question.difficulty,
    }
    updated = (
        supabase.table("questions").update(update_data).eq("id", question_id).execute().data
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update question")
    return QuestionOut(**updated[0])

@router.delete("/questions/{question_id}", summary="Delete question")
async def delete_question(
    question_id: int,
    current_company: Annotated[Company, Depends(get_current_active_company)],
):
    qrec = (
        supabase.table("questions").select("role_id").eq("id", question_id).execute().data
    )
    if not qrec:
        raise HTTPException(status_code=404, detail="Question not found")
    role_id = qrec[0]["role_id"]
    role_record = supabase.table("roles").select("company_id").eq("id", role_id).execute().data
    if not role_record or role_record[0]["company_id"] != current_company.company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this question")

    deleted = supabase.table("questions").delete().eq("id", question_id).execute()
    if deleted:
        return {"message": "Question deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to delete question")

@router.get("/interviews/{interview_id}/evaluate-transcript", summary="Evaluate interview transcript")
async def evaluate_interview_transcript(
    interview_id: int,
    current_company: Annotated[CompanyInDB, Depends(get_current_active_company)],
):
    interview = get_owned_interview(interview_id, current_company)
    if interview.get("ai_evaluation"):
        return {"transcript": interview.get("transcript") or "", "evaluation": interview["ai_evaluation"]}
    if not interview.get("call_id"):
        raise HTTPException(status_code=409, detail="This interview has no recorded call yet.")

    require_quota(supabase, "evaluation")
    try:
        transcript = retrive_transcript(interview["call_id"])
    except (RuntimeError, requests.RequestException) as exc:
        logger.exception("Transcript retrieval failed for interview %s", interview_id)
        raise HTTPException(
            status_code=502, detail="Could not grade the interview right now. Try again later."
        ) from exc
    if not transcript or transcript == "Failed to retrieve transcript":
        raise HTTPException(status_code=409, detail="The transcript isn't ready yet. Try again in a minute.")
    try:
        evaluation = json.loads(grade_transcript(transcript))
    except (RuntimeError, requests.RequestException) as exc:
        logger.exception("Transcript grading failed for interview %s", interview_id)
        raise HTTPException(
            status_code=502, detail="Could not grade the interview right now. Try again later."
        ) from exc
    supabase.table("interviews").update(
        {"transcript": transcript, "ai_evaluation": evaluation}
    ).eq("id", interview_id).execute()
    return {"transcript": transcript, "evaluation": evaluation}
