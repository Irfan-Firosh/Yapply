import supabase
import os
import dotenv
from pydantic import BaseModel
from datetime import datetime

dotenv.load_dotenv()


class Company(BaseModel):
    id: int
    created_at: datetime
    username: str
    email: str
    disabled: bool

class CompanyInDB(Company):
    hashed_password: str

username="johndoe"

supabase = supabase.create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
result = supabase.table("company").select("*").eq("username", username).execute().data[0]
print(CompanyInDB(**result))