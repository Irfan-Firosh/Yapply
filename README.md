# Yapply

AI voice interviews: a company schedules a candidate, an AI interviewer phones them, and the transcript is graded automatically.

**Live demo:** https://yapply.irfanfirosh.app
- Company login: `yapply` / `secret`
- Candidate login: `candidate@example.com` (sample interview; to hear a real call, schedule an interview with your own email and phone, then log in with that email)

## Stack

- `frontend/` — Vite, React 18, TypeScript, Tailwind, shadcn/ui
- `backend/` — FastAPI, Supabase (Postgres), Vapi (voice calls), OpenAI (grading)
- Hosting — one Vercel project using Services: `/api/*` goes to FastAPI, everything else to the SPA

Phone calls, voice agent creation, and transcript grading are capped per day (`DAILY_*_LIMIT`). A daily cron calls `/api/cron/daily`, which resets the demo company's data.

## Local development

Requires Node 20+, Python 3.12, [uv](https://docs.astral.sh/uv/), and the Vercel CLI.

```bash
vercel link --project yapply
vercel env pull backend/.env

cd backend
uv venv -p 3.12 .venv
uv pip install -p .venv/bin/python -r requirements.txt -r requirements-dev.txt
.venv/bin/python -m pytest
.venv/bin/uvicorn main:app --reload --port 8000

cd ../frontend
npm install
npm run dev        # http://localhost:8080, proxies /api to :8000
```

## Database

- `backend/supabase/migrations/0001_init.sql` — tables, `consume_quota`, `reset_demo`
- `backend/supabase/seed.sql` — demo company

```bash
cd backend
DATABASE_URL=postgres://... uv run --with 'psycopg[binary]' python scripts/apply_sql.py supabase/migrations/0001_init.sql supabase/seed.sql
.venv/bin/python scripts/create_demo_workflows.py
```
