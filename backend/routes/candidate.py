import logging
from typing import Annotated

import requests
from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from db_functions.access_table import get_supabase_client
from helper.candidate.create_call import make_call
from utils.quota import require_quota
from utils.tokens import CREDENTIALS_EXCEPTION, issue_token, read_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidate", tags=["candidate"])
supabase = get_supabase_client()
security = HTTPBearer()

SAMPLE_CALL_MESSAGE = (
    "Sample interviews can't place calls. Schedule an interview with your own "
    "phone number and log in with that email."
)


class Candidate(BaseModel):
    candidate_name: str
    candidate_email: str | None = None
    position: str | None = None
    candidate_phone: str


class CandidateInDB(Candidate):
    id: int
    company_id: str
    vapi_workflow_id: str | None = None
    is_sample: bool = False


@router.post("/token", summary="Log in as a candidate with the interview email")
async def login_candidate(email: Annotated[str, Form()]):
    rows = (
        supabase.table("interviews")
        .select("id")
        .eq("candidate_email", email.strip().lower())
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No interview found for this email")
    return {"access_token": issue_token(str(rows[0]["id"]), "candidate"), "token_type": "bearer"}


async def get_current_candidate(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CandidateInDB:
    interview_id = read_token(credentials.credentials, "candidate")
    if not interview_id.isdigit():
        raise CREDENTIALS_EXCEPTION
    rows = supabase.table("interviews").select("*").eq("id", int(interview_id)).execute().data
    if not rows:
        raise CREDENTIALS_EXCEPTION
    return CandidateInDB(**rows[0])


@router.get("/dashboard", summary="Get candidate dashboard", response_model=Candidate)
async def get_candidate_dashboard(current_candidate: Annotated[CandidateInDB, Depends(get_current_candidate)]):
    return current_candidate


@router.get("/profile", summary="Get candidate profile", response_model=Candidate)
async def get_candidate_profile(current_candidate: Annotated[CandidateInDB, Depends(get_current_candidate)]):
    return current_candidate


@router.get("/company", summary="Get company name", response_model=str)
async def get_company_name(current_candidate: Annotated[CandidateInDB, Depends(get_current_candidate)]):
    rows = supabase.table("company").select("username").eq("company_id", current_candidate.company_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Company not found")
    return rows[0]["username"]


@router.get("/createcall", summary="Start the AI phone interview", response_model=str)
async def create_call(current_candidate: Annotated[CandidateInDB, Depends(get_current_candidate)]):
    if current_candidate.is_sample:
        raise HTTPException(status_code=400, detail=SAMPLE_CALL_MESSAGE)
    if not current_candidate.vapi_workflow_id:
        raise HTTPException(status_code=409, detail="This interview's role has no voice agent yet.")
    require_quota(supabase, "call")
    try:
        call_id = make_call(
            current_candidate.vapi_workflow_id,
            current_candidate.candidate_phone,
            current_candidate.candidate_name,
        )
    except (RuntimeError, requests.RequestException) as exc:
        logger.exception("Vapi call failed for interview %s", current_candidate.id)
        raise HTTPException(
            status_code=502, detail="Could not start the call. Check the phone number and try again."
        ) from exc
    supabase.table("interviews").update({"call_id": call_id, "status": "Completed"}).eq(
        "id", current_candidate.id
    ).execute()
    return call_id
