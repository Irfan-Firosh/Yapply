from passlib.context import CryptContext

pwd_context = CryptContext(["bcrypt"], deprecated="auto")

def hash_password(access_code: str) -> str:
    return pwd_context.hash(access_code)

def verify_password(plain_code: str, hashed_code: str) -> bool:
    return pwd_context.verify(plain_code, hashed_code)

if __name__ == "__main__":
    print(hash_password("secret"))
