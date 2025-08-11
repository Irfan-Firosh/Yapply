import supabase
import os
import dotenv

dotenv.load_dotenv()

supabase = supabase.create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))