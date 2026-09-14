"""One-off: create Vapi workflows for the seeded demo roles and remember their ids.

Usage (from backend/, with backend/.env pulled from Vercel):
  .venv/bin/python scripts/create_demo_workflows.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db_functions.access_table import get_supabase_client  # noqa: E402
from helper.company.genworkflow import create_automated_interview_workflow, post_workflow  # noqa: E402

DEMO_COMPANY = "yapply"


def main() -> None:
    client = get_supabase_client()
    company = client.table("company").select("company_id, username").eq("username", DEMO_COMPANY).execute().data[0]
    roles = client.table("roles").select("id, title").eq("company_id", company["company_id"]).execute().data
    for role in roles:
        questions = [
            row["question_text"]
            for row in client.table("questions").select("question_text").eq("role_id", role["id"]).execute().data
        ]
        workflow = create_automated_interview_workflow(
            questions=questions,
            company_name=company["username"],
            interviewer_name="Alex",
            name=f"{company['username']}_{role['title']}_Interview_Workflow",
            voice="andrew",
            model="gpt-4o",
            timeout_seconds=45,
        )
        workflow_id = post_workflow(workflow)
        client.table("demo_workflows").upsert({"role_title": role["title"], "vapi_workflow_id": workflow_id}).execute()
        print(f"{role['title']}: {workflow_id}")
    client.rpc("reset_demo", {}).execute()
    print("demo data reset with workflow ids")


if __name__ == "__main__":
    main()
