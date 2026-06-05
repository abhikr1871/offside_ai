from typing import List
from pydantic import BaseModel, Field

class QuestionRequest(BaseModel):
    query: str = Field(..., example="When is the final match and where is it played?")

class SourceDocument(BaseModel):
    match_no: int
    stage: str
    date: str
    time: str
    home_team: str
    away_team: str
    venue: str
    city: str
    country: str

class QuestionResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceDocument]
    model_used: str
