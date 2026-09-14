import pytest

from tests.helpers import add_company, add_interview, candidate_headers, company_headers
from utils.tokens import issue_token, read_token


async def test_login_matches_email_case_insensitively_and_picks_latest(client, db):
    add_interview(db, created_at="2026-01-01T00:00:00+00:00")
    latest = add_interview(db, created_at="2026-02-01T00:00:00+00:00")
    response = await client.post("/api/candidate/token", data={"email": "  ADA@Example.com "})
    assert response.status_code == 200
    assert read_token(response.json()["access_token"], "candidate") == str(latest["id"])


async def test_login_unknown_email_is_401(client, db):
    response = await client.post("/api/candidate/token", data={"email": "nobody@example.com"})
    assert response.status_code == 401
    assert response.json()["detail"] == "No interview found for this email"


async def test_dashboard_returns_the_token_interview(client, db):
    interview = add_interview(db, candidate_name="Grace Hopper")
    response = await client.get("/api/candidate/dashboard", headers=candidate_headers(interview["id"]))
    assert response.status_code == 200
    assert response.json()["candidate_name"] == "Grace Hopper"


async def test_candidate_route_rejects_company_token(client, db):
    add_company(db)
    add_interview(db)
    assert (await client.get("/api/candidate/dashboard", headers=company_headers())).status_code == 401


async def test_candidate_token_for_deleted_interview_is_401(client, db):
    assert (await client.get("/api/candidate/dashboard", headers=candidate_headers(999))).status_code == 401


async def test_candidate_token_with_non_numeric_subject_is_401(client, db):
    headers = {"Authorization": f"Bearer {issue_token('abc', 'candidate')}"}
    assert (await client.get("/api/candidate/dashboard", headers=headers)).status_code == 401


async def test_company_name_for_candidate(client, db):
    add_company(db, username="acme")
    interview = add_interview(db)
    response = await client.get("/api/candidate/company", headers=candidate_headers(interview["id"]))
    assert response.status_code == 200
    assert response.json() == "acme"


async def test_createcall_on_sample_interview_is_400_without_quota(client, db, monkeypatch):
    interview = add_interview(db, is_sample=True)
    monkeypatch.setattr("routes.candidate.make_call", lambda *a: pytest.fail("Vapi called"))
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 400
    assert response.json()["detail"].startswith("Sample interviews can't place calls.")
    assert db.quota_used == {}


async def test_createcall_updates_only_the_token_interview(client, db, monkeypatch):
    mine = add_interview(db)
    same_email = add_interview(db)
    calls = []

    def fake_make_call(workflow_id, phone, name):
        calls.append((workflow_id, phone, name))
        return "call_42"

    monkeypatch.setattr("routes.candidate.make_call", fake_make_call)
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(mine["id"]))
    assert response.status_code == 200
    assert response.json() == "call_42"
    assert calls == [("wf_123", "+15555550123", "Ada Lovelace")]
    rows = {row["id"]: row for row in db.tables["interviews"]}
    assert rows[mine["id"]]["call_id"] == "call_42"
    assert rows[mine["id"]]["status"] == "Completed"
    assert rows[same_email["id"]]["call_id"] is None


async def test_createcall_without_workflow_is_409(client, db):
    interview = add_interview(db, vapi_workflow_id=None)
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 409


async def test_createcall_quota_exhausted_is_429(client, db, monkeypatch):
    interview = add_interview(db)
    monkeypatch.setenv("DAILY_CALL_LIMIT", "0")
    monkeypatch.setattr("routes.candidate.make_call", lambda *a: pytest.fail("Vapi called"))
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 429


async def test_createcall_vapi_failure_is_502(client, db, monkeypatch):
    interview = add_interview(db)

    def failing_call(*_args):
        raise RuntimeError("Vapi call failed: 400 - invalid number")

    monkeypatch.setattr("routes.candidate.make_call", failing_call)
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 502
    assert "invalid number" not in response.json()["detail"]
