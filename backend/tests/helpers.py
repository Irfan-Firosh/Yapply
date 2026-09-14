from utils.security import hash_password
from utils.tokens import issue_token

ACME_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "22222222-2222-2222-2222-222222222222"


def add_company(db, username: str = "acme", company_id: str = ACME_ID, password: str = "pw") -> dict:
    return db.insert_row("company", {
        "company_id": company_id,
        "username": username,
        "email": f"{username}@example.com",
        "hashed_password": hash_password(password),
        "disabled": False,
    })


def company_headers(username: str = "acme") -> dict:
    return {"Authorization": f"Bearer {issue_token(username, 'company')}"}


def add_interview(db, company_id: str = ACME_ID, **overrides) -> dict:
    row = {
        "company_id": company_id,
        "candidate_name": "Ada Lovelace",
        "candidate_email": "ada@example.com",
        "candidate_phone": "+15555550123",
        "position": "Engineer",
        "status": "Scheduled",
        "interview_date": None,
        "interview_time": None,
        "call_id": None,
        "transcript": None,
        "ai_evaluation": None,
        "vapi_workflow_id": "wf_123",
        "is_sample": False,
    }
    return db.insert_row("interviews", {**row, **overrides})


def candidate_headers(interview_id: int) -> dict:
    return {"Authorization": f"Bearer {issue_token(str(interview_id), 'candidate')}"}
