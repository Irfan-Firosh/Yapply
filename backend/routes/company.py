from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated
from pydantic import BaseModel
from datetime import datetime
from utils.security import verify_password
import os
import dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError
from db_functions.access_table import supabase

dotenv.load_dotenv()

router = APIRouter(prefix="/company", tags=["company"])


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class Company(BaseModel):
    id: int
    created_at: datetime
    username: str
    email: str
    disabled: bool

class CompanyInDB(Company):
    company_id: str
    hashed_password: str

class Interview(BaseModel):
    id: int
    created_at: datetime
    company_id: str
    candidate_name: str
    candidate_email: str
    candidate_phone: str
    position: str | None = None
    status: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    transcript_link: str | None = None


company_oatuh2_scheme = OAuth2PasswordBearer(tokenUrl="company/token")


def get_company(username: str):
    company_dict = supabase.table("company").select("*").eq("username", username).execute().data[0]
    if company_dict:
        return CompanyInDB(**company_dict)
    return None

# Can be used to authenticate company in login process
def authenticate_company(username: str, password: str):
    company = get_company(username)
    if not company:
        return False
    if not verify_password(password, company.hashed_password):
        return False
    return company

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = expires_delta + datetime.now(timezone.utc)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("TOKEN_EXPIRY_TIME")))
    
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("JWT_SECRET_KEY"), algorithm="HS256")
    return encoded_jwt

async def get_current_company(token: Annotated[str, Depends(company_oatuh2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    company = get_company(username=token_data.username)
    if not company:
        raise credentials_exception
    return company

async def get_current_active_company(current_company: Annotated[Company, Depends(get_current_company)]):
    if current_company.disabled:
        raise HTTPException(status_code=400, detail="Inactive company")
    supabase.rpc("set_company_session", {"company_id": current_company.company_id}).execute()
    return current_company

@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    company = authenticate_company(form_data.username, form_data.password)
    if not company:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=int(os.getenv("TOKEN_EXPIRY_TIME")))
    data = {
        "sub": company.username,
        "role": "company",
        "company_id": company.company_id
    }
    access_token = create_access_token(data=data, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/", summary="Get company info", response_model=Company)
async def get_company_info(current_company: Annotated[Company, Depends(get_current_active_company)]):
    return current_company

@router.get("/interviews", summary="Get company interviews", response_model=list[Interview])
async def get_company_interviews(current_company: Annotated[Company, Depends(get_current_active_company)]):
    interviews = supabase.table("interviews").select("*").execute().data
    return [Interview(**interview_dict) for interview_dict in interviews]

@router.get("/interviews/{interview_id}", summary="Get company interview", response_model=Interview)
async def get_company_interview(interview_id: int, current_company: Annotated[Company, Depends(get_current_active_company)]):
    interview = supabase.table("interviews").select("*").eq("id", interview_id).execute().data[0]
    return Interview(**interview)

@router.post("/interviews", summary="Create company interview", response_model=Interview)
async def create_company_interview(interview: Interview, current_company: Annotated[Company, Depends(get_current_active_company)]):
    interview.company_id = current_company.company_id
    interview.created_at = datetime.now(timezone.utc)
    interview = supabase.table("interviews").insert(interview.model_dump()).execute().data
    return interview