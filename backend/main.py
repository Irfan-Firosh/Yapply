import os
from typing import Annotated

import dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException

dotenv.load_dotenv()

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
