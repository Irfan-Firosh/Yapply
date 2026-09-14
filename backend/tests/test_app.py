async def test_health_ok(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_company_routes_live_under_api_prefix(client):
    assert (await client.get("/company/")).status_code == 404
    assert (await client.get("/api/company/")).status_code == 401


async def test_tutorial_auth_router_is_gone(client):
    response = await client.post("/api/auth/token", data={"username": "johndoe", "password": "secret"})
    assert response.status_code == 404


async def test_cron_rejects_missing_or_wrong_secret(client, db):
    assert (await client.get("/api/cron/daily")).status_code == 401
    assert (await client.get("/api/cron/daily", headers={"Authorization": "Bearer wrong"})).status_code == 401
    assert db.rpc_calls == []


async def test_cron_resets_demo_with_correct_secret(client, db):
    response = await client.get("/api/cron/daily", headers={"Authorization": "Bearer cron-secret"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert db.rpc_calls == [("reset_demo", {})]
