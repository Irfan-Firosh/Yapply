import os
import requests
import dotenv
import json
import langchain_openai
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
import json

dotenv.load_dotenv()

def retrive_transcript(call_id: str) -> str:
    headers = {
        "Authorization": f"Bearer {os.getenv('VAPI_API_KEY')}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"https://api.vapi.ai/call/{call_id}", headers=headers)

    if response.status_code == 200:
        return response.json().get("transcript")
    
    return "Failed to retrieve transcript"


class Scores(BaseModel):
    technical_score: int
    technical_comment: str
    communication_score: int
    communication_comment: str
    problem_solving_score: int
    problem_solving_comment: str
    experience_score: int
    experience_comment: str
    leadership_score: int
    leadership_comment: str
    adaptability_score: int
    adaptability_comment: str
    overall_score: int
    overall_comment: str
    recommendation: str
    key_strengths: str

def grade_transcript(transcript: str) -> str:
    llm = langchain_openai.ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
    strucuted_llm = llm.with_structured_output(Scores)
    system_prompt = """
You are a senior technical interviewer with extensive experience evaluating candidates for CS/tech positions. 
Analyze the interview transcript and provide scores (0-100) and detailed comments for each category.

**SCORING GUIDELINES:**
Use the full 0-100 range with these benchmarks:
- 90-100: Exceptional performance, top-tier candidate
- 80-89: Strong performance, clearly above average
- 70-79: Good performance, meets role expectations
- 60-69: Adequate performance, some areas of concern
- 50-59: Below average, notable gaps or weaknesses
- 0-49: Poor performance, significant deficiencies

**EVALUATION CATEGORIES:**

1. **TECHNICAL_SCORE & TECHNICAL_COMMENT:**
   - Technical knowledge depth and accuracy
   - Understanding of relevant technologies, frameworks, and tools
   - Coding ability, algorithm knowledge, system design concepts
   - Best practices and engineering fundamentals
   - Comment should include specific examples from the transcript

2. **COMMUNICATION_SCORE & COMMUNICATION_COMMENT:**
   - Clarity in explaining technical concepts
   - Active listening and question comprehension
   - Ability to articulate thought processes
   - Professional communication style and engagement
   - Comment should highlight communication strengths/weaknesses with examples

3. **PROBLEM_SOLVING_SCORE & PROBLEM_SOLVING_COMMENT:**
   - Approach to analyzing and breaking down problems
   - Logical reasoning and structured thinking
   - Creativity and efficiency in finding solutions
   - Handling of edge cases and constraints
   - Comment should describe their problem-solving methodology with specific instances

4. **EXPERIENCE_SCORE & EXPERIENCE_COMMENT:**
   - Relevance and depth of past work experience
   - Demonstrated impact and ownership in previous roles
   - Learning from challenges and applying lessons
   - Industry knowledge and practical application
   - Comment should reference specific projects or experiences mentioned

5. **LEADERSHIP_SCORE & LEADERSHIP_COMMENT:**
   - Examples of leading projects, teams, or initiatives
   - Mentoring, teaching, or knowledge-sharing experiences
   - Decision-making and taking ownership
   - Influence and collaboration across teams
   - Comment should cite specific leadership examples or assess leadership potential

6. **ADAPTABILITY_SCORE & ADAPTABILITY_COMMENT:**
   - Learning new technologies, frameworks, or domains
   - Handling change, ambiguity, and uncertainty
   - Flexibility in approach and openness to feedback
   - Growth mindset and continuous improvement
   - Comment should include examples of adaptation or learning agility

7. **OVERALL_SCORE & OVERALL_COMMENT:**
   - Holistic assessment considering all factors
   - Hiring recommendation (Strong Hire/Hire/No Hire/Strong No Hire)
   - Key strengths and primary concerns
   - Fit for the specific role and team
   - Comment should provide hiring recommendation with 2-3 key supporting points

**RESPONSE FORMAT:**
You must respond with a JSON object that exactly matches the Scores model structure. 
Ensure all comments are specific, evidence-based, and reference concrete examples from the interview transcript. 
Comments should be 2-4 sentences each, providing clear justification for the assigned scores.

Example format:
{{
    "technical_score": 85,
    "technical_comment": "Candidate demonstrated strong knowledge of...",
    "communication_score": 78,
    "communication_comment": "Explained concepts clearly but...",
    "problem_solving_score": 90,
    "problem_solving_comment": "Logical reasoning and structured thinking...",
    "experience_score": 85,
    "experience_comment": "Relevant experience and practical application...",
    "leadership_score": 75,
    "leadership_comment": "Examples of leading projects or teams...",
    "adaptability_score": 88,
    "adaptability_comment": "Learning new technologies and adapting to changes...",
    "overall_score": 85,
    "overall_comment": "Holistic assessment considering all factors...",
    "recommendation": "Strong Hire",
    "key_strengths": "Strong technical knowledge and problem-solving skills..."
}}
"""

    user_prompt = """
Evaluate this interview transcript and provide scores with detailed comments:

**Interview Transcript:**
{transcript}
"""

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt)
    ])
    result = strucuted_llm.invoke(prompt_template.invoke({"transcript": transcript}))
    return json.dumps(result.model_dump(), indent=2)

if __name__ == "__main__":
    transcript = retrive_transcript("5d8231e3-20fd-4503-8304-fb5b1ab07918")
    print(grade_transcript(transcript))