from fastapi import APIRouter, HTTPException, Query

from app.schemas.logistics_schema import (
    AgentActionLogRequest,
    FanProfile,
    IncidentEscalationRequest,
    InventoryUpdateRequest,
    ToolActionResponse,
)
from app.services.logistics_service import logistics_service

router = APIRouter(
    prefix="/api/v1/logistics",
    tags=["logistics"],
)


@router.get("/fans/{fan_id}", response_model=FanProfile)
async def get_fan_profile(fan_id: str):
    try:
        return logistics_service.get_fan_profile(fan_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/transport/options")
async def get_transport_options(
    fan_id: str = Query(...),
    venue_id: str = Query(...),
):
    try:
        return logistics_service.get_transport_options(fan_id=fan_id, venue_id=venue_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/inventory/update", response_model=ToolActionResponse)
async def update_inventory(request: InventoryUpdateRequest):
    try:
        return logistics_service.update_inventory(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/incidents/escalate", response_model=ToolActionResponse)
async def escalate_incident(request: IncidentEscalationRequest):
    try:
        return logistics_service.escalate_incident(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/action-log")
async def log_agent_action(request: AgentActionLogRequest):
    return logistics_service.log_agent_action(request)


@router.get("/state")
async def get_logistics_state():
    return logistics_service.get_state_snapshot()
