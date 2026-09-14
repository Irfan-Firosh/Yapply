"""Apply SQL files to DATABASE_URL in order, each inside its own transaction.

Usage (from backend/):
  DATABASE_URL=postgres://... uv run --with 'psycopg[binary]' python scripts/apply_sql.py FILE [FILE...]
"""
import os
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg

# Drop non-libpq query parameters (such as `supa`) that some pooler URLs carry.
UNSUPPORTED_PARAMS = {"supa"}


def clean_url(url: str) -> str:
    parts = urlsplit(url)
    query = [(key, value) for key, value in parse_qsl(parts.query) if key not in UNSUPPORTED_PARAMS]
    return urlunsplit(parts._replace(query=urlencode(query)))


def main(paths: list[str]) -> None:
    if not paths:
        sys.exit("usage: apply_sql.py FILE [FILE...]")
    with psycopg.connect(clean_url(os.environ["DATABASE_URL"]), autocommit=True, prepare_threshold=None) as conn:
        for path in paths:
            with conn.transaction():
                conn.execute(Path(path).read_text())
            print(f"applied {path}")


if __name__ == "__main__":
    main(sys.argv[1:])
