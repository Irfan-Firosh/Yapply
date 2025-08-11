from fastapi import FastAPI, HTTPException, Depends
from routes.jwttoken import router, get_current_active_user
from typing import Annotated
import dotenv
from routes.company import router as company_router
import uvicorn

dotenv.load_dotenv()


app = FastAPI()

UNAUTHORIZED_USER = HTTPException(status_code=401, detail="Unauthorized")

app.include_router(router)
app.include_router(company_router)

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.get("/company")
async def get_company(current_user: Annotated[str, Depends(get_current_active_user)]):
    if current_user is None:
        raise UNAUTHORIZED_USER
    return {"message": "Hello World"}
