from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.competitions_schema import (
    CompetitionsResponse,
    CompetitionTeamsResponse,
    TeamDetailedResponse
)
from app.services.competitions_service import competitions_service

router = APIRouter(
    prefix="/api/v1/competitions",
    tags=["competitions"]
)

teams_router = APIRouter(
    prefix="/api/v1/teams",
    tags=["teams"]
)

@router.get("/", response_model=CompetitionsResponse)
async def get_competitions(
    code: Optional[str] = Query(None, description="Filter competitions by league code (e.g. PL, CL, ELC)")
):
    """
    Fetch competitions data from football-data.org via CompetitionsService.
    Supports local filtering by league code.
    Does not provide any mock fallbacks in case of error.
    """
    try:
        return await competitions_service.fetch_competitions(code=code)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch competitions: {exc}"
        )

@router.get("/{code}/teams", response_model=CompetitionTeamsResponse)
async def get_competition_teams(code: str):
    """
    Fetch teams in a specific competition from football-data.org.
    Caches response in MongoDB for 10 days.
    """
    try:
        return await competitions_service.fetch_competition_teams(code=code)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch competition teams for '{code}': {exc}"
        )

@teams_router.get("/{team_id}", response_model=TeamDetailedResponse)
async def get_team_squad(team_id: int):
    """
    Fetch detailed team information and players squad list from football-data.org.
    Caches response in MongoDB for 10 days.
    """
    try:
        return await competitions_service.fetch_team_squad(team_id=team_id)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch squad for team {team_id}: {exc}"
        )
