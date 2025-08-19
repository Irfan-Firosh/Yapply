import langchain_openai
from langchain_core.prompts import ChatPromptTemplate
import dotenv
import os
from pydantic import BaseModel

dotenv.load_dotenv()

class Scores(BaseModel):
    programming_skills: int
    system_design: int
    algorithms_data_structures: int
    database_knowledge: int
    software_engineering: int
    
    # Domain-Specific Technical Skills (0-100)
    web_development: int
    cloud_platforms: int
    machine_learning: int
    cybersecurity: int
    mobile_development: int
    
    # Soft Skills & Professional Qualities (0-100)
    communication: int
    problem_solving: int
    collaboration: int
    adaptability: int
    leadership_potential: int
    
    # Experience & Project Quality (0-100)
    project_complexity: int
    impact_results: int
    technical_depth: int
    industry_experience: int
    
    # Interview Performance (0-100)
    technical_accuracy: int
    code_quality: int
    thought_process: int
    questions_asked: int
    
    # Overall Assessment
    overall_score: int
    recommendation: str
    key_strengths: str
    areas_for_improvement: str
    fit_for_role: int
    



def evaluate_transcript(transcript: str) -> str:
    llm = langchain_openai.ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
    strucuted_llm = llm.with_structured_output(Scores)
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are an expert technical interviewer evaluating candidates for CS/tech positions. 
        Analyze the interview transcript and provide scores (0-100) for each category based on the candidate's responses.
        
        Scoring Categories:
        - Technical Knowledge: programming_skills, system_design, algorithms_data_structures, database_knowledge, software_engineering
        - Domain-Specific Skills: web_development, cloud_platforms, machine_learning, cybersecurity, mobile_development  
        - Soft Skills: communication, problem_solving, collaboration, adaptability, leadership_potential
        - Experience: project_complexity, impact_results, technical_depth, industry_experience
        - Interview Performance: technical_accuracy, code_quality, thought_process, questions_asked
        - Overall Assessment: overall_score (0-100), recommendation ("Strong Hire"/"Hire"/"No Hire"/"Strong No Hire"), 
          key_strengths, areas_for_improvement, fit_for_role (0-100)
        
        Score based on evidence in the transcript. If a category isn't demonstrated, score conservatively.
        Be specific in your key_strengths and areas_for_improvement fields."""),
        ("user", "Please evaluate this interview transcript:\n\n{transcript}")
    ])
    return strucuted_llm.invoke(prompt_template.invoke({"transcript": transcript}))