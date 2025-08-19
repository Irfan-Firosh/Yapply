import json
from typing import List, Dict, Any
import requests
import os
import dotenv

dotenv.load_dotenv()

def create_automated_interview_workflow(
    questions: List[str],
    company_name: str = "Your Company",
    interviewer_name: str = "AI Interviewer",
    name: str = "Automated Interview",
    voice: str = "andrew",
    model: str = "gpt-4",
    timeout_seconds: int = 30
) -> Dict[str, Any]:
    """
    Creates a comprehensive automated interview workflow with error handling and smooth candidate experience.
    
    Args:
        questions: List of interview questions to ask
        company_name: Name of the company conducting the interview
        interviewer_name: Name of the AI interviewer
        name: Workflow name
        voice: Voice ID for speech synthesis
        model: AI model to use  
        timeout_seconds: Global timeout for the workflow
    
    Returns:
        Complete Vapi workflow configuration
    """
    
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    
    nodes.append({
        "name": "introduction",
        "type": "conversation",
        "isStart": True,
        "metadata": {
            "position": {"x": -400, "y": -200}
        },
        "prompt": f"You are {interviewer_name}, a professional AI interviewer for {company_name}. Start the interview professionally, explain the process, and set expectations. Be warm but professional.",
        "messagePlan": {
            "firstMessage": f"Hello {{{{candidate_name}}}}, this is {interviewer_name} from {company_name}. Thank you for joining us today for your interview. I'll be asking you several questions, and I want to ensure I capture your responses accurately. Please take your time with each answer. Let's begin."
        },
        "model": {
            "provider": "openai",
            "model": model,
            "temperature": 0.3,
            "maxTokens": 200
        },
        "voice": {
            "provider": "azure",
            "voiceId": voice
        },
        "transcriber": {
            "provider": "assembly-ai",
            "language": "en",
            "confidenceThreshold": 0.6
        }
    })
    
    if questions:
        for idx, question in enumerate(questions):
            x_pos = -300 + (idx * 250)
            y_pos = 100 + (idx * 200)
            
            nodes.append({
                "name": f"question_{idx + 1}",
                "type": "conversation",
                "metadata": {
                    "position": {"x": x_pos, "y": y_pos}
                },
                "prompt": f"Ask question {idx + 1} clearly and professionally. After asking, listen carefully to the candidate's response. Acknowledge their answer briefly before proceeding.",
                "variableExtractionPlan": {
                    "output": [
                        {
                            "type": "string",
                            "title": f"answer_{idx + 1}",
                            "description": f"Candidate's answer to question {idx + 1}"
                        },
                        {
                            "type": "number",
                            "title": f"quality_{idx + 1}",
                            "description": f"Answer quality score 1-10 based on completeness and relevance"
                        },
                        {
                            "type": "boolean",
                            "title": f"understood_{idx + 1}",
                            "description": f"Whether the candidate understood and answered the question"
                        }
                    ]
                },
                "messagePlan": {
                    "firstMessage": question
                },
                "model": {
                    "provider": "openai",
                    "model": model,
                    "temperature": 0.4,
                    "maxTokens": 300
                },
                "voice": {
                    "provider": "azure",
                    "voiceId": voice
                },
                "transcriber": {
                    "provider": "assembly-ai",
                    "language": "en",
                    "confidenceThreshold": 0.6
                }
            })
            
            nodes.append({
                "name": f"retry_{idx + 1}",
                "type": "conversation",
                "metadata": {
                    "position": {"x": x_pos + 300, "y": y_pos + 100}
                },
                "prompt": "Politely ask the candidate to clarify or expand on their answer. Be encouraging and specific about what you need.",
                "messagePlan": {
                    "firstMessage": f"I'd like to make sure I understand your response completely. Could you please elaborate on your answer to: '{question}'? Feel free to provide more details or examples."
                },
                "model": {
                    "provider": "openai",
                    "model": model,
                    "temperature": 0.4,
                    "maxTokens": 250
                },
                "voice": {
                    "provider": "azure",
                    "voiceId": voice
                },
                "transcriber": {
                    "provider": "assembly-ai",
                    "language": "en",
                    "confidenceThreshold": 0.6
                }
            })
            
            nodes.append({
                "name": f"retry2_{idx + 1}",
                "type": "conversation",
                "metadata": {
                    "position": {"x": x_pos + 300, "y": y_pos + 200}
                },
                "prompt": "Ask the question in a different way to help the candidate understand. Be supportive and provide context.",
                "messagePlan": {
                    "firstMessage": f"Let me rephrase that question to make it clearer: {question} Please share your thoughts or experience related to this."
                },
                "model": {
                    "provider": "openai",
                    "model": model,
                    "temperature": 0.4,
                    "maxTokens": 250
                },
                "voice": {
                    "provider": "azure",
                    "voiceId": voice
                },
                "transcriber": {
                    "provider": "assembly-ai",
                    "language": "en",
                    "confidenceThreshold": 0.6
                }
            })
        
        nodes.append({
            "name": "progression",
            "type": "conversation",
            "metadata": {
                "position": {"x": 200, "y": 800}
            },
            "prompt": "Assess if all questions have been answered satisfactorily. If yes, proceed to conclusion. If not, identify which questions need more attention.",
            "variableExtractionPlan": {
                "output": [
                    {
                        "type": "boolean",
                        "title": "interview_complete",
                        "description": "Whether all questions have satisfactory answers"
                    },
                    {
                        "type": "number",
                        "title": "overall_score",
                        "description": "Overall interview quality score 1-10"
                    }
                ]
            },
            "messagePlan": {
                "firstMessage": "Thank you for your responses. Let me review what we've covered and ensure I have all the information needed."
            },
            "model": {
                "provider": "openai",
                "model": model,
                "temperature": 0.3,
                "maxTokens": 200
            },
            "voice": {
                "provider": "azure",
                "voiceId": voice
            },
            "transcriber": {
                "provider": "assembly-ai",
                "language": "en",
                "confidenceThreshold": 0.6
            }
        })
    
    nodes.append({
        "name": "conclusion",
        "type": "conversation",
        "metadata": {
            "position": {"x": 400, "y": 1000}
        },
        "prompt": "Thank the candidate professionally, explain next steps, and end the interview on a positive note.",
        "messagePlan": {
            "firstMessage": f"Thank you for your time today, {{{{candidate_name}}}}. You've provided thoughtful responses to our questions. Our team at {company_name} will review your interview and be in touch within the next few business days with next steps. We appreciate your interest in joining our team. Have a wonderful day!"
        },
        "model": {
            "provider": "openai",
            "model": model,
            "temperature": 0.3,
            "maxTokens": 200
        },
        "voice": {
            "provider": "azure",
            "voiceId": voice
        },
        "transcriber": {
            "provider": "assembly-ai",
            "language": "en",
            "confidenceThreshold": 0.6
        }
    })
    
    nodes.append({
        "name": "hangup",
        "type": "tool",
        "metadata": {
            "position": {"x": 600, "y": 1000}
        },
        "tool": {
            "type": "endCall",
            "function": {
                "name": "end_interview",
                "parameters": {
                    "type": "object",
                    "required": [],
                    "properties": {}
                }
            },
            "messages": [
                {
                    "type": "request-start",
                    "content": "Interview completed successfully. Ending call.",
                    "blocking": True
                }
            ]
        }
    })
    
    if questions:
        edges.append({
            "from": "introduction",
            "to": "question_1"
        })
        
        for idx, _ in enumerate(questions):
            current_q = f"question_{idx + 1}"
            retry1 = f"retry_{idx + 1}"
            retry2 = f"retry2_{idx + 1}"
            next_q = f"question_{idx + 2}" if idx + 1 < len(questions) else "progression"
            
            edges.append({
                "from": current_q,
                "to": retry1,
                "condition": {
                    "type": "ai",
                    "prompt": f"Return {{\"retry\": true}} if {{$[{current_q}].understood_{idx + 1}}} == false or {{$[{current_q}].quality_{idx + 1}}} < 6 or the response is too short/unclear."
                }
            })
            
            edges.append({
                "from": current_q,
                "to": next_q,
                "condition": {
                    "type": "ai",
                    "prompt": f"Return {{\"next\": true}} if {{$[{current_q}].understood_{idx + 1}}} == true and {{$[{current_q}].quality_{idx + 1}}} >= 6."
                }
            })
            
            edges.append({
                "from": retry1,
                "to": retry2,
                "condition": {
                    "type": "ai",
                    "prompt": f"Return {{\"retry2\": true}} if the response is still unclear or {{$[{current_q}].quality_{idx + 1}}} < 6 after the first retry."
                }
            })
            
            edges.append({
                "from": retry1,
                "to": next_q,
                "condition": {
                    "type": "ai",
                    "prompt": f"Return {{\"next\": true}} if the response is now clear and {{$[{current_q}].quality_{idx + 1}}} >= 6 after clarification."
                }
            })
            
            edges.append({
                "from": retry2,
                "to": next_q,
                "condition": {
                    "type": "ai",
                    "prompt": f"Return {{\"next\": true}} to proceed to the next question after the second retry attempt."
                }
            })
        
        edges.append({
            "from": "progression",
            "to": "conclusion"
        })
        
        edges.append({
            "from": "conclusion",
            "to": "hangup"
        })
        
    else:
        edges.extend([
            {"from": "introduction", "to": "conclusion"},
            {"from": "conclusion", "to": "hangup"}
        ])
    
    workflow = {
        "name": name,
        "nodes": nodes,
        "edges": edges,
        "globalPrompt": f"You are {interviewer_name}, conducting an automated interview for {company_name}. Be professional, patient, and ensure you capture complete responses from candidates.",
        "model": {
            "provider": "openai",
            "model": model,
            "temperature": 0.4,
            "maxTokens": 300
        },
        "voice": {
            "provider": "azure",
            "voiceId": voice
        },
        "transcriber": {
            "provider": "assembly-ai",
            "language": "en",
            "confidenceThreshold": 0.6
        },
        "server": {
            "timeoutSeconds": timeout_seconds
        },
        "artifactPlan": {
            "recordingEnabled": True,
            "recordingFormat": "wav"
        }
    }
    
    return workflow

def post_workflow(workflow: Dict[str, Any]):
    headers = {
        "Authorization": f"Bearer {os.getenv('VAPI_API_KEY')}",
        "Content-Type": "application/json"
    }

    data = json.dumps(workflow)

    response = requests.post("https://api.vapi.ai/workflow", headers=headers, json=data)
    return response.json()


def save_workflow(workflow: Dict[str, Any], filename: str):
    with open(filename, 'w') as f:
        json.dump(workflow, f, indent=2)


if __name__ == "__main__":
    sample_questions = [
        "Tell me about yourself and your background."
    ]
        
    workflow = create_automated_interview_workflow(
        questions=sample_questions,
        company_name="TechCorp Solutions",
        interviewer_name="Alex",
        name="Technical Interview Workflow",
        voice="andrew",
        model="gpt-4o",
        timeout_seconds=45
    )

    print(post_workflow(workflow))
