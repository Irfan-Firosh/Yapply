import os
from typing import Optional

import dotenv
from supabase import Client, create_client

dotenv.load_dotenv()

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SECRET_KEY must be set")
        _supabase_client = create_client(url, key)
    return _supabase_client
