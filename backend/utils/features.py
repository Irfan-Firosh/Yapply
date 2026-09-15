import os


def calls_enabled() -> bool:
    """Whether live Vapi phone interviews are enabled.

    Vapi retired its Workflows feature on 2026-08-18, so
    `POST https://api.vapi.ai/workflow` now returns 403 and workflow-based
    calls fail. Until the app migrates to Vapi Assistants, this flag stays
    off by default so the demo degrades gracefully: scheduling, logins,
    seeded transcripts, AI evaluations and quota caps keep working.
    """
    return os.getenv("CALLS_ENABLED", "false").strip().lower() in {"1", "true", "yes"}
