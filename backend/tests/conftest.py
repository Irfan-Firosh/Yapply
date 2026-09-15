import os

import pytest
from httpx import ASGITransport, AsyncClient

os.environ.update({
    "SUPABASE_URL": "http://localhost:54321",
    "SUPABASE_SECRET_KEY": "test-secret-key",
    "JWT_SECRET_KEY": "test-jwt-secret",
    "TOKEN_EXPIRY_TIME": "60",
    "CRON_SECRET": "cron-secret",
    "CALLS_ENABLED": "true",
})

from db_functions import access_table  # noqa: E402
from tests.fakes import FakeSupabase  # noqa: E402

FAKE_DB = FakeSupabase()
access_table._supabase_client = FAKE_DB

from main import app  # noqa: E402


@pytest.fixture
def db() -> FakeSupabase:
    FAKE_DB.reset()
    return FAKE_DB


@pytest.fixture
async def client(db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        yield http
