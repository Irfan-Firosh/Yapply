"""CALLS_ENABLED demo-mode gate: live Vapi phone interviews are off by default
because Vapi retired Workflows on 2026-08-18.
"""
import pytest

from tests.helpers import ACME_ID, add_company, add_interview, company_headers, candidate_headers

CALLS_OFF_DETAIL = (
    "Live phone interviews are turned off in this demo. The scheduled interviews, "
    "transcripts and AI evaluations are all real."
)
WORKFLOW_OFF_DETAIL = "Voice agent creation is turned off in this demo."


def _add_role_with_question(db, **overrides) -> dict:
    role = db.insert_row(
        "roles",
        {"company_id": ACME_ID, "title": "Engineer", "vapi_workflow_id": None, **overrides},
    )
    db.insert_row(
        "questions",
        {"role_id": role["id"], "question_text": "Why us?", "question_type": "text", "difficulty": "easy"},
    )
    return role


# --- createcall -------------------------------------------------------------


async def test_createcall_is_503_when_calls_env_var_unset(client, db, monkeypatch):
    monkeypatch.delenv("CALLS_ENABLED", raising=False)
    interview = add_interview(db)
    monkeypatch.setattr("routes.candidate.make_call", lambda *a: pytest.fail("Vapi called"))
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 503
    assert response.json()["detail"] == CALLS_OFF_DETAIL
    assert db.quota_used == {}


async def test_createcall_is_503_when_calls_env_var_false(client, db, monkeypatch):
    monkeypatch.setenv("CALLS_ENABLED", "false")
    interview = add_interview(db)
    monkeypatch.setattr("routes.candidate.make_call", lambda *a: pytest.fail("Vapi called"))
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 503
    assert response.json()["detail"] == CALLS_OFF_DETAIL
    assert db.quota_used == {}


async def test_createcall_still_works_when_calls_env_var_true(client, db, monkeypatch):
    monkeypatch.setenv("CALLS_ENABLED", "true")
    interview = add_interview(db)
    calls = []

    def fake_make_call(workflow_id, phone, name):
        calls.append((workflow_id, phone, name))
        return "call_42"

    monkeypatch.setattr("routes.candidate.make_call", fake_make_call)
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 200
    assert response.json() == "call_42"
    assert calls == [("wf_123", "+15555550123", "Ada Lovelace")]


async def test_createcall_sample_interview_still_400_when_calls_env_var_true(client, db, monkeypatch):
    monkeypatch.setenv("CALLS_ENABLED", "true")
    interview = add_interview(db, is_sample=True)
    monkeypatch.setattr("routes.candidate.make_call", lambda *a: pytest.fail("Vapi called"))
    response = await client.get("/api/candidate/createcall", headers=candidate_headers(interview["id"]))
    assert response.status_code == 400


# --- create-workflow ---------------------------------------------------------


async def test_create_workflow_is_503_when_calls_env_var_unset(client, db, monkeypatch):
    monkeypatch.delenv("CALLS_ENABLED", raising=False)
    add_company(db)
    role = _add_role_with_question(db)
    monkeypatch.setattr("routes.company.post_workflow", lambda _w: pytest.fail("Vapi called"))
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 503
    assert response.json()["detail"] == WORKFLOW_OFF_DETAIL
    assert db.quota_used == {}


async def test_create_workflow_is_503_when_calls_env_var_false(client, db, monkeypatch):
    monkeypatch.setenv("CALLS_ENABLED", "false")
    add_company(db)
    role = _add_role_with_question(db)
    monkeypatch.setattr("routes.company.post_workflow", lambda _w: pytest.fail("Vapi called"))
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 503
    assert response.json()["detail"] == WORKFLOW_OFF_DETAIL
    assert db.quota_used == {}


async def test_create_workflow_404_still_wins_over_flag_when_role_missing(client, db, monkeypatch):
    monkeypatch.delenv("CALLS_ENABLED", raising=False)
    add_company(db)
    response = await client.post("/api/company/roles/999/create-workflow", headers=company_headers())
    assert response.status_code == 404


async def test_create_workflow_still_works_when_calls_env_var_true(client, db, monkeypatch):
    monkeypatch.setenv("CALLS_ENABLED", "true")
    add_company(db)
    role = _add_role_with_question(db)
    monkeypatch.setattr("routes.company.post_workflow", lambda _w: "wf_new")
    response = await client.post(f"/api/company/roles/{role['id']}/create-workflow", headers=company_headers())
    assert response.status_code == 200
    assert response.json() == {"vapi_workflow_id": "wf_new"}
    assert db.tables["roles"][0]["vapi_workflow_id"] == "wf_new"
    assert db.quota_used == {"workflow": 1}


# --- get_company_roles --------------------------------------------------------


async def test_get_company_roles_includes_role_without_voice_agent(client, db):
    add_company(db)
    role = db.insert_row("roles", {"company_id": ACME_ID, "title": "Designer", "vapi_workflow_id": None})
    response = await client.get("/api/company/roles", headers=company_headers())
    assert response.status_code == 200
    body = response.json()
    assert any(r["id"] == role["id"] and r["vapi_workflow_id"] is None for r in body)
