from fastapi import APIRouter, HTTPException, Query
from app.services.live_match_services import live_match_services
from app.schemas.live_matches_schema import LiveMatchFeedResponse

router = APIRouter(
    prefix="/api/v1/live-matches",
    tags=["live-matches"],
)

@router.get("/feed", response_model=LiveMatchFeedResponse)
async def get_live_match_feed(league: str = Query("PL")):
    """
    Retrieve current or recently completed match scores from football-data.org.
    """
    try:
        return await live_match_services.get_live_matches(league=league)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/teams")
async def get_league_teams(league: str = Query("PL")):
    """
    Retrieve the list of active teams for the selected league.
    """
    try:
        return await live_match_services.get_teams_by_league(league=league)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/match/{match_id}")
async def get_match_detail(match_id: str):
    """
    Retrieve detailed statistics, lineups, and events for a specific match.
    """
    try:
        return await live_match_services.get_match_detail(match_id)
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=str(exc))
