import random
import string
import hashlib
from datetime import datetime

def gen_seed(company_id: str, timestamp: datetime):
    seed = f"{company_id}{timestamp.isoformat()}"
    hash = hashlib.sha256(seed.encode()).hexdigest()
    return int(hash, 16) % (10 ** 8)

def gen_candidate_id(rnd: random.Random) -> str:
    prefix = ''.join(rnd.choices(string.ascii_uppercase, k=4))
    number = rnd.randint(0, 999)
    return f"{prefix}{number}"

def gen_access_code(rnd: random.Random) -> str:
    letters = ''.join(rnd.choices(string.ascii_uppercase, k=3))
    digits = ''.join(rnd.choices(string.digits, k=3))
    return f"{letters}{digits}"

def gen_credentials(company_id: str, timestamp: datetime) -> tuple[str, str]:
    if timestamp is None:
        timestamp = datetime.now()
    seed = gen_seed(company_id, timestamp)
    rnd = random.Random(seed)
    return gen_candidate_id(rnd), gen_access_code(rnd)