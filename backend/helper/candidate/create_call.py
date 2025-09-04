import os
import dotenv
import requests

dotenv.load_dotenv()

VAPI_BASE_URL = "https://api.vapi.ai"

def make_call(workflow_id: str, phone_number: str, name: str) -> str:
    api_key = os.getenv("VAPI_API_KEY")
    phone_number_id = os.getenv("VAPI_PHONE_NUMBER_ID")


    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "customer": {
            "number": phone_number,
            "name": name
        },
        "workflowId": workflow_id,
        "name": f"{name}'s Interview",
        "phoneNumberId": phone_number_id,
        "workflowOverrides": {
            "variableValues": {
                "candidate_name": name
            }
        }
    }


    resp = requests.post(f"{VAPI_BASE_URL}/call", headers=headers, json=payload, timeout=30)
    if resp.status_code >= 400:
        raise RuntimeError(f"Vapi call failed: {resp.status_code} - {resp.text}")
    return resp.json().get("id")

def retrive_transcript(call_id: str) -> str:
    headers = {
        "Authorization": f"Bearer {os.getenv('VAPI_API_KEY')}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{VAPI_BASE_URL}/call/{call_id}", headers=headers)

    if response.status_code == 200:
        return response.json().get("transcript")
    
    return "Failed to retrieve transcript"


if __name__ == "__main__":
    print(retrive_transcript("1ba63891-d679-4074-8a1b-441933406601"))
