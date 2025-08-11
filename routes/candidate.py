from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/candidate", tags=["candidate"])

class Candidate(BaseModel):
    id: str
    name: str
    access_code: str


@router.get("/", summary="Display Candidate Info")
def candidate_login(username: str, password: str):

