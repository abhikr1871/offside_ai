from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.agent_service import agent_service

router = APIRouter(
    prefix="/api/v1/agent",
    tags=["agent"],
)

class AgentChatRequest(BaseModel):
    email: str
    query: str

@router.post("/chat")
async def chat_with_agent(req: AgentChatRequest):
    try:
        response = await agent_service.run_chat(req.email, req.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
