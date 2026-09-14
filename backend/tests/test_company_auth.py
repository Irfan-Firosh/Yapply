from datetime import datetime, timedelta, timezone

import jwt

from tests.helpers import add_company, company_headers
from utils.tokens import issue_token, read_token


async def test_login_returns_company_typed_token(client, db):
    add_company(db, password="pw")
    response = await client.post("/api/company/token", data={"username": "acme", "password": "pw"})
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert read_token(response.json()["access_token"], "company") == "acme"


async def test_login_unknown_username_is_401(client, db):
    response = await client.post("/api/company/token", data={"username": "ghost", "password": "pw"})
    assert response.status_code == 401


async def test_login_wrong_password_is_401(client, db):
    add_company(db, password="pw")
    response = await client.post("/api/company/token", data={"username": "acme", "password": "nope"})
    assert response.status_code == 401


async def test_company_route_accepts_company_token(client, db):
    add_company(db)
    response = await client.get("/api/company/", headers=company_headers())
    assert response.status_code == 200
    assert response.json()["username"] == "acme"


async def test_company_route_rejects_candidate_token(client, db):
    add_company(db)
    headers = {"Authorization": f"Bearer {issue_token('acme', 'candidate')}"}
    assert (await client.get("/api/company/", headers=headers)).status_code == 401


async def test_company_route_rejects_untyped_token(client, db):
    add_company(db)
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = jwt.encode({"sub": "acme", "exp": expires}, "test-jwt-secret", algorithm="HS256")
    assert (await client.get("/api/company/", headers={"Authorization": f"Bearer {token}"})).status_code == 401


async def test_company_token_for_deleted_company_is_401(client, db):
    assert (await client.get("/api/company/", headers=company_headers("ghost"))).status_code == 401


async def test_company_auth_does_not_call_session_rpc(client, db):
    add_company(db)
    await client.get("/api/company/", headers=company_headers())
    assert db.rpc_calls == []
