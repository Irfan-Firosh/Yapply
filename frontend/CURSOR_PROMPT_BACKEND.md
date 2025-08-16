# FastAPI Backend Cursor Prompt

## Context
You are helping with a FastAPI backend that handles candidate authentication via Supabase JWT tokens. The frontend sends a verified JWT token, and the backend needs to process it.

## Current Situation
- **Frontend**: Sends fresh Supabase JWT token via Bearer authorization
- **Backend**: Should verify the token and return candidate data
- **Route**: `GET /candidate/dashboard`
- **Authentication**: The verified candidate's `auth.uuid` and `email` will be sent

## Required Implementation

### The Route Should:
1. **Receive**: Bearer JWT token from Supabase (already verified by frontend)
2. **Extract**: User email and UUID from the JWT token
3. **Query**: Find candidate in `interviews` table by `candidate_email`
4. **Return**: Candidate body containing at minimum the `candidate_name`

### Expected Response Format:
```json
{
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com", 
  "position": "Software Engineer",
  "candidate_phone": "+1234567890",
  "company_id": "comp_123"
}
```

### Current FastAPI Setup:
- Router prefix: `/candidate`
- Route: `/dashboard`
- Security: HTTPBearer()
- Database: Supabase table `interviews`

### Key Points:
- The JWT token is **already verified** by the frontend using Supabase
- Extract email from the verified JWT payload
- Find the candidate record in the `interviews` table
- Return the candidate data as specified in the `Candidate` model

### Debug Information Available:
- User email from JWT
- User UUID from JWT  
- Token expiration time
- All candidate fields from interviews table

Please implement the JWT token processing and candidate lookup logic for the `/candidate/dashboard` endpoint.
