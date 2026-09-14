import os

from fastapi import HTTPException, status

LIMITS = {
    "call": ("DAILY_CALL_LIMIT", 3, "phone calls"),
    "workflow": ("DAILY_WORKFLOW_LIMIT", 5, "voice agent creation"),
    "evaluation": ("DAILY_EVALUATION_LIMIT", 10, "transcript evaluations"),
}


def require_quota(client, action: str) -> None:
    env_name, default_limit, label = LIMITS[action]
    limit = int(os.getenv(env_name, str(default_limit)))
    allowed = client.rpc("consume_quota", {"p_action": action, "p_limit": limit}).execute().data
    if allowed is not True:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily demo limit reached for {label}. Resets at 00:00 UTC.",
        )
