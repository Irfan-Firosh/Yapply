import json

import pytest

from tests.helpers import ACME_ID, OTHER_ID, add_company, add_interview, company_headers

EVALUATION = {"overall_score": 80, "recommendation": "Hire"}


async def test_get_other_company_interview_is_404(client, db):
    add_company(db)
    other = add_interview(db, company_id=OTHER_ID)
    response = await client.get(f"/api/company/interviews/{other['id']}", headers=company_headers())
    assert response.status_code == 404


async def test_get_own_interview_serialises_evaluation(client, db):
    add_company(db)
    own = add_interview(db, ai_evaluation=EVALUATION)
    response = await client.get(f"/api/company/interviews/{own['id']}", headers=company_headers())
    assert response.status_code == 200
    assert json.loads(response.json()["ai_evaluation"]) == EVALUATION


async def test_delete_other_company_interview_is_404_and_row_kept(client, db):
    add_company(db)
    other = add_interview(db, company_id=OTHER_ID)
    response = await client.delete(f"/api/company/interviews/{other['id']}", headers=company_headers())
    assert response.status_code == 404
    assert [row["id"] for row in db.tables["interviews"]] == [other["id"]]


async def test_delete_own_interview(client, db):
    add_company(db)
    own = add_interview(db)
    response = await client.delete(f"/api/company/interviews/{own['id']}", headers=company_headers())
    assert response.status_code == 200
    assert db.tables["interviews"] == []


async def test_evaluate_other_company_interview_is_404(client, db):
    add_company(db)
    other = add_interview(db, company_id=OTHER_ID, call_id="call_1")
    response = await client.get(f"/api/company/interviews/{other['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 404


async def test_evaluate_returns_cached_evaluation_without_grading(client, db, monkeypatch):
    add_company(db)
    own = add_interview(db, ai_evaluation=EVALUATION, transcript="AI: hi")
    monkeypatch.setattr("routes.company.grade_transcript", lambda _t: pytest.fail("graded a cached evaluation"))
    response = await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 200
    assert response.json() == {"transcript": "AI: hi", "evaluation": EVALUATION}


async def test_evaluate_fresh_returns_evaluation_object(client, db, monkeypatch):
    add_company(db)
    own = add_interview(db, call_id="call_1", status="Completed")
    monkeypatch.setattr("routes.company.retrive_transcript", lambda call_id: f"transcript for {call_id}")
    monkeypatch.setattr("routes.company.grade_transcript", lambda _t: json.dumps(EVALUATION))
    response = await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 200
    assert response.json() == {"transcript": "transcript for call_1", "evaluation": EVALUATION}
    assert db.tables["interviews"][0]["ai_evaluation"] == EVALUATION


async def test_evaluate_without_call_is_409(client, db):
    add_company(db)
    own = add_interview(db)
    response = await client.get(f"/api/company/interviews/{own['id']}/evaluate-transcript", headers=company_headers())
    assert response.status_code == 409


async def test_magic_link_endpoints_are_removed(client, db):
    add_company(db)
    own = add_interview(db)
    for suffix in ("send-link", "link-status"):
        response = await client.get(f"/api/company/interviews/{own['id']}/{suffix}", headers=company_headers())
        assert response.status_code == 404


async def test_create_interview_lowercases_email(client, db):
    add_company(db)
    response = await client.post(
        "/api/company/interviews",
        headers=company_headers(),
        data={"candidate_name": "Ada", "candidate_phone": "+15555550123", "candidate_email": "  Ada@Example.COM "},
    )
    assert response.status_code == 200
    assert db.tables["interviews"][0]["candidate_email"] == "ada@example.com"
    assert db.tables["interviews"][0]["company_id"] == ACME_ID
