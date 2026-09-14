import re
from pathlib import Path

from utils.security import verify_password

SUPABASE_DIR = Path(__file__).resolve().parents[1] / "supabase"
MIGRATION = (SUPABASE_DIR / "migrations" / "0001_init.sql").read_text() if (SUPABASE_DIR / "migrations" / "0001_init.sql").exists() else ""
SEED = (SUPABASE_DIR / "seed.sql").read_text() if (SUPABASE_DIR / "seed.sql").exists() else ""


def test_seed_demo_password_is_secret():
    match = re.search(r"'(\$2b\$12\$[^']+)'", SEED)
    assert match, "bcrypt hash not found in seed.sql"
    assert verify_password("secret", match.group(1))


def test_functions_are_not_executable_by_public_roles():
    for signature in ("consume_quota(text, int)", "reset_demo()"):
        assert f"revoke execute on function {signature} from public, anon, authenticated;" in MIGRATION


def test_every_table_has_row_level_security():
    tables = re.findall(r"create table (\w+)", MIGRATION)
    assert set(tables) == {"company", "roles", "questions", "interviews", "usage_counters", "demo_workflows"}
    for table in tables:
        assert f"alter table {table} enable row level security;" in MIGRATION


def test_demo_candidate_is_seeded_as_sample():
    assert "'candidate@example.com'" in MIGRATION
    assert MIGRATION.count(", true)") >= 4


def test_quota_functions_return_rows_and_are_granted_to_service_role():
    assert "returns table(allowed boolean)" in MIGRATION
    assert "returns table(ok boolean)" in MIGRATION
    assert "grant execute on function consume_quota(text, int) to service_role;" in MIGRATION
    assert "grant execute on function reset_demo() to service_role;" in MIGRATION
    assert "set search_path = public as" not in MIGRATION
