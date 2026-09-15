import os
from typing import Annotated

import dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException

dotenv.load_dotenv()


def check_environment() -> None:
    """Validate required deploy configuration, collecting every problem at once."""
    errors: list[str] = []

    if not os.getenv("SUPABASE_URL"):
        errors.append("Missing SUPABASE_URL")

    if not (
        os.getenv("SUPABASE_SECRET_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
    ):
        errors.append(
            "Missing Supabase key: set one of SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_KEY"
        )

    if not os.getenv("JWT_SECRET_KEY"):
        errors.append("Missing JWT_SECRET_KEY")

    for name in ("TOKEN_EXPIRY_TIME", "DAILY_CALL_LIMIT", "DAILY_WORKFLOW_LIMIT", "DAILY_EVALUATION_LIMIT"):
        value = os.getenv(name)
        if value is not None:
            try:
                int(value)
            except ValueError:
                errors.append(f"{name} must be an integer, got {value!r}")

    if errors:
        raise RuntimeError("Invalid environment configuration: " + "; ".join(errors))


check_environment()

from db_functions.access_table import get_supabase_client  # noqa: E402
from routes.candidate import router as candidate_router  # noqa: E402
from routes.company import router as company_router  # noqa: E402

app = FastAPI(title="Yapply API")

api = APIRouter(prefix="/api")
api.include_router(company_router)
api.include_router(candidate_router)


@api.get("/health")
async def health():
    get_supabase_client().table("company").select("id").limit(1).execute()
    return {"status": "ok"}


@api.get("/cron/daily")
async def cron_daily(authorization: Annotated[str | None, Header()] = None):
    secret = os.getenv("CRON_SECRET")
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    get_supabase_client().rpc("reset_demo", {}).execute()
    return {"status": "ok"}


app.include_router(api)
