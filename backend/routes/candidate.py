from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
import dotenv
from db_functions.access_table import get_supabase_client
from helper.candidate.create_call import make_call, retrive_transcript
dotenv.load_dotenv()

router = APIRouter(prefix="/candidate", tags=["candidate"])
supabase = get_supabase_client()

security = HTTPBearer()

class Candidate(BaseModel):
    candidate_name: str
    candidate_email: str
    position: str | None = None
    candidate_phone: str

class CandidateInDB(Candidate):
    company_id: str
    vapi_workflow_id: str | None = None


def verify_candidate(email: str):
    try:
        candidate_dict = supabase.table("interviews").select("*").eq("candidate_email", email).execute().data
        
        if candidate_dict and len(candidate_dict) > 0:
            return CandidateInDB(**candidate_dict[0])
    except Exception:
        pass
    return None

async def get_current_candidate(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        

        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise credentials_exception
            
        candidate_email = user_response.user.email
        auth_user_id = user_response.user.id
        
        if not candidate_email:
            raise credentials_exception
            
        candidate = verify_candidate(candidate_email)
        
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found in interviews"
            )
        
        try:
            supabase.table("interviews").update({
                "candidate_auth": auth_user_id
            }).eq("candidate_email", candidate_email).execute()
        except Exception:
            pass
            
        return candidate
        
    except Exception:
        raise credentials_exception


@router.get("/dashboard", summary="Get candidate dashboard", response_model=Candidate)
async def get_candidate_dashboard(current_candidate: Annotated[Candidate, Depends(get_current_candidate)]):
    return current_candidate

@router.get("/profile", summary="Get candidate profile", response_model=Candidate)
async def get_candidate_profile(current_candidate: Annotated[Candidate, Depends(get_current_candidate)]):
    return current_candidate

@router.get("/company", summary="Get company name", response_model=str)
async def get_company_name(current_candidate: Annotated[Candidate, Depends(get_current_candidate)]):
    company_uid = verify_candidate(current_candidate.candidate_email).company_id
    company = supabase.table("company").select("*").eq("company_id", company_uid).execute().data[0]
    return company["username"]

@router.get("/call", summary="Get phone call", response_model=str)
async def get_phone_call(current_candidate: Annotated[Candidate, Depends(get_current_candidate)]):
    return "phone call"

@router.get("/createcall", summary="Create phone call", response_model=str)
async def get_vapi_workflow_id(current_candidate: Annotated[Candidate, Depends(get_current_candidate)]):
    workflow_id = current_candidate.vapi_workflow_id
    call_id = make_call(workflow_id, current_candidate.candidate_phone, current_candidate.candidate_name)
    supabase.table("interviews").update({"call_id": call_id, "status": "Completed"}).eq("candidate_email", current_candidate.candidate_email).execute()
    return call_id



