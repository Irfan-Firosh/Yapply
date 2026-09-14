import json

import pytest
from fastapi import HTTPException

from tests.helpers import add_company, add_interview, company_headers
from utils.quota import require_quota


def test_quota_allows_until_limit_then_429(db, monkeypatch):
    monkeypatch.setenv("DAILY_CALL_LIMIT", "2")
    require_quota(db, "call")
    require_quota(db, "call")
    with pytest.raises(HTTPException) as exc:
        require_quota(db, "call")
    assert exc.value.status_code == 429
    assert exc.value.detail == "Daily demo limit reached for phone calls. Resets at 00:00 UTC."


def test_zero_limit_blocks_immediately(db, monkeypatch):
    monkeypatch.setenv("DAILY_WORKFLOW_LIMIT", "0")
    with pytest.raises(HTTPException) as exc:
        require_quota(db, "workflow")
    assert exc.value.status_code == 429


def _add_role_with_question(db) -> dict:
    role = db.insert_row("roles", {"company_id": "11111111-1111-1111-1111-111111111111", "title": "Engineer", "vapi_workflow_id": None})
    db.insert_row("questions", {"role_id": role["id"], "question_text": "Why us?", "question_type": "text", "difficulty": "easy"})
    return role


async def test_create_workflow_blocked_when_quota_exhausted(client, db, monkeypatch):
    add_company(db)
    role = _add_role_with_question(db)
    monkeypatch.setenv("DAILY_WORKFLOW_LIMIT", "0")
    monkeypatch.setattr("routes.company.post_workflow", lambda _w: pytest.fail("Vapi called"))
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 429


async def test_create_workflow_maps_vapi_failure_to_502(client, db, monkeypatch):
    add_company(db)
    role = _add_role_with_question(db)

    def failing_post(_workflow):
        raise RuntimeError("Vapi workflow creation failed: 400")

    monkeypatch.setattr("routes.company.post_workflow", failing_post)
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 502
    assert "400" not in response.json()["detail"]


async def test_create_workflow_success_stores_id(client, db, monkeypatch):
    add_company(db)
    role = _add_role_with_question(db)
    monkeypatch.setattr("routes.company.post_workflow", lambda _w: "wf_new")
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 200
    assert response.json() == {"vapi_workflow_id": "wf_new"}
    assert db.tables["roles"][0]["vapi_workflow_id"] == "wf_new"
    assert db.quota_used == {"workflow": 1}


async def test_fresh_evaluation_blocked_when_quota_exhausted(client, db, monkeypatch):
    add_company(db)
    own = add_interview(db, call_id="call_1")
    monkeypatch.setenv("DAILY_EVALUATION_LIMIT", "0")
    monkeypatch.setattr("routes.company.retrive_transcript", lambda _c: pytest.fail("Vapi called"))
    response = await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 429


async def test_cached_evaluation_consumes_no_quota(client, db):
    add_company(db)
    own = add_interview(db, ai_evaluation={"overall_score": 70}, transcript="t")
    response = await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 200
    assert db.quota_used == {}


async def test_fresh_evaluation_consumes_one_quota(client, db, monkeypatch):
    add_company(db)
    own = add_interview(db, call_id="call_1")
    monkeypatch.setattr("routes.company.retrive_transcript", lambda _c: "t")
    monkeypatch.setattr("routes.company.grade_transcript", lambda _t: json.dumps({"overall_score": 70}))
    await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert db.quota_used == {"evaluation": 1}
