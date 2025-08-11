import jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional

# Pydantic class for user credentials
class User(BaseModel):
    username: str
    password: str

# JWT configuration
SECRET_KEY = "test-secret-key-12345"
ALGORITHM = "HS256"

def create_jwt_token(payload: dict, expires_minutes: int = 30) -> str:
    """Create a JWT token with given payload"""
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str) -> dict:
    """Decode a JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return {}
    except jwt.InvalidTokenError:
        print("Invalid token")
        return {}

def extract_user_from_payload(payload: dict) -> User:
    """Extract username and password from JWT payload"""
    username = payload.get("username")
    password = payload.get("password")
    
    if not username or not password:
        raise ValueError("Username or password missing from payload")
    
    return User(username=username, password=password)

# Test with two different payloads
def test_jwt_with_different_payloads():
    print("=== JWT Encode/Decode Test ===\n")
    
    # Payload 1: Basic payload with just username and password
    payload1 = {
        "username": "johndoe",
        "password": "secret123"
    }
    
    # Payload 2: Same username/password but with extra field
    payload2 = {
        "username": "johndoe", 
        "password": "secret123",
        "role": "admin",  # Extra field
        "company_id": "12345",  # Another extra field
        "permissions": ["read", "write"]  # Yet another extra field
    }
    
    print("Payload 1 (basic):")
    print(payload1)
    print()
    
    print("Payload 2 (with extra fields):")
    print(payload2)
    print()
    
    # Create tokens
    token1 = create_jwt_token(payload1)
    token2 = create_jwt_token(payload2)
    
    print("Token 1:")
    print(token1)
    print()
    
    print("Token 2:")
    print(token2)
    print()
    
    # Decode tokens
    decoded1 = decode_jwt_token(token1)
    decoded2 = decode_jwt_token(token2)
    
    print("Decoded payload 1:")
    print(decoded1)
    print()
    
    print("Decoded payload 2:")
    print(decoded2)
    print()
    
    # Extract users from both payloads
    try:
        user1 = extract_user_from_payload(decoded1)
        user2 = extract_user_from_payload(decoded2)
        
        print("User from token 1:")
        print(f"Username: {user1.username}, Password: {user1.password}")
        print()
        
        print("User from token 2:")
        print(f"Username: {user2.username}, Password: {user2.password}")
        print()
        
        # Check if they have the same username and password
        same_credentials = (user1.username == user2.username and 
                          user1.password == user2.password)
        
        print(f"Do both tokens decode to the same username/password? {same_credentials}")
        print()
        
        # Show the extra fields in payload 2
        print("Extra fields in payload 2:")
        extra_fields = {k: v for k, v in decoded2.items() 
                       if k not in ['username', 'password', 'exp']}
        print(extra_fields)
        
    except ValueError as e:
        print(f"Error extracting user: {e}")

if __name__ == "__main__":
    test_jwt_with_different_payloads()
