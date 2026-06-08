from fastapi import APIRouter, HTTPException, Query
from app.services.live_match_services import live_match_services
from app.schemas.live_matches_schema import LiveMatchFeedResponse
from app.api.auth import MOCK_USERS_DB
from app.db.vector_search import vector_search_manager
from app.services.team_matches_helper import fetch_team_matches, TEAM_ID_MAP

import asyncio

router = APIRouter(
    prefix="/api/v1/live-matches",
    tags=["live-matches"],
)

from datetime import datetime, timedelta, timezone
import random

TEAM_CRESTS = {
    "Arsenal": "https://crests.football-data.org/57.png",
    "Chelsea": "https://crests.football-data.org/61.png",
    "Liverpool": "https://crests.football-data.org/64.png",
    "Manchester City": "https://crests.football-data.org/65.png",
    "Man City": "https://crests.football-data.org/65.png",
    "Manchester United": "https://crests.football-data.org/66.png",
    "Tottenham Hotspur": "https://crests.football-data.org/73.png",
    "Aston Villa": "https://crests.football-data.org/58.png",
    "Newcastle United": "https://crests.football-data.org/67.png",
    "Real Madrid CF": "https://crests.football-data.org/86.png",
    "Real Madrid": "https://crests.football-data.org/86.png",
    "FC Barcelona": "https://crests.football-data.org/81.png",
    "Barcelona": "https://crests.football-data.org/81.png",
    "Club Atlético de Madrid": "https://crests.football-data.org/78.png",
    "Atletico Madrid": "https://crests.football-data.org/78.png",
    "Paris Saint-Germain FC": "https://crests.football-data.org/524.png",
    "PSG": "https://crests.football-data.org/524.png",
    "Paris Saint-Germain": "https://crests.football-data.org/524.png",
    "Bayern Munich": "https://crests.football-data.org/5.png",
    "FC Bayern München": "https://crests.football-data.org/5.png",
    "Germany": "https://crests.football-data.org/759.svg",
}

def generate_mock_upcoming_matches(followed_teams: list) -> list:
    opponents = [
        ("Chelsea", 61, "https://crests.football-data.org/61.png", "Stamford Bridge", "PL", "Premier League"),
        ("Liverpool", 64, "https://crests.football-data.org/64.png", "Anfield", "PL", "Premier League"),
        ("Manchester United", 66, "https://crests.football-data.org/66.png", "Old Trafford", "PL", "Premier League"),
        ("Tottenham Hotspur", 73, "https://crests.football-data.org/73.png", "Tottenham Hotspur Stadium", "PL", "Premier League"),
        ("Newcastle United", 67, "https://crests.football-data.org/67.png", "St. James' Park", "PL", "Premier League"),
        ("Real Madrid CF", 86, "https://crests.football-data.org/86.png", "Santiago Bernabéu", "PD", "LaLiga"),
        ("FC Barcelona", 81, "https://crests.football-data.org/81.png", "Camp Nou", "PD", "LaLiga"),
        ("Bayern Munich", 5, "https://crests.football-data.org/5.png", "Allianz Arena", "BL1", "Bundesliga"),
    ]
    
    mocked = []
    now = datetime.now(timezone.utc)
    
    for i, team in enumerate(followed_teams):
        team_id = TEAM_ID_MAP.get(team) or (9999 + i)
        team_crest = TEAM_CRESTS.get(team, "")
        
        filtered_opps = [o for o in opponents if o[0].lower() != team.lower()]
        if not filtered_opps:
            filtered_opps = opponents
        opp = random.choice(filtered_opps)
        opp_name, opp_id, opp_crest, opp_venue, opp_lc, opp_l = opp
        
        is_home = (i % 2 == 0)
        home_team = team if is_home else opp_name
        away_team = opp_name if is_home else team
        home_crest = team_crest if is_home else opp_crest
        away_crest = opp_crest if is_home else team_crest
        home_id = team_id if is_home else opp_id
        away_id = opp_id if is_home else team_id
        
        venue = f"{team} Stadium" if is_home else opp_venue
        event_date = now + timedelta(days=2 + i * 2, hours=random.randint(12, 19))
        
        mocked.append({
            "id": f"mock-upcoming-{team.lower().replace(' ', '-')}-{i}",
            "homeTeam": home_team,
            "awayTeam": away_team,
            "homeCrest": home_crest,
            "awayCrest": away_crest,
            "homeTeamId": home_id,
            "awayTeamId": away_id,
            "homeScore": 0,
            "awayScore": 0,
            "minute": "",
            "isLive": False,
            "status": "SCHEDULED",
            "venue": venue,
            "eventDate": event_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "league": opp_l,
            "league_code": opp_lc,
            "goals": [],
            "bookings": [],
            "sourceName": "Football-Data.org (Mocked)"
        })
        
    return mocked


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


@router.get("/followed-upcoming")
async def get_followed_upcoming_matches(email: str = Query(...)):
    """
    Returns upcoming / recent matches for the user's followed teams.

    Strategy:
      1. Resolve the user's followed_teams list from MongoDB or the in-memory store.
      2. Map each team name to its football-data.org team ID via TEAM_ID_MAP.
      3. Call GET /v4/teams/{id}/matches concurrently for each team.
      4. Merge, de-duplicate by match id, and return sorted results.

    Falls back gracefully: teams whose ID is unknown are silently skipped.
    """
    email = email.strip().lower()

    # ── 1. Resolve followed teams ──────────────────────────────────────────────
    followed_teams: list = []

    if vector_search_manager.db is not None:
        try:
            users_col = vector_search_manager.db["users"]
            user = await users_col.find_one({"email": email})
            if user:
                followed_teams = user.get("followed_teams", [])
        except Exception:
            pass

    if not followed_teams and email in MOCK_USERS_DB:
        followed_teams = MOCK_USERS_DB[email].get("followed_teams", [])

    # Sensible default so the dashboard never shows empty state for new users
    if not followed_teams:
        followed_teams = ["Arsenal"]

    # ── 2. Map team names to IDs ───────────────────────────────────────────────
    # Build a deduplicated list of (team_name, team_id) pairs we can actually query
    teams_to_query: list = []
    for team in followed_teams:
        team_id = TEAM_ID_MAP.get(team)
        if team_id:
            teams_to_query.append((team, team_id))
        else:
            # Fuzzy fallback: try lowercase partial match in the map
            lower = team.lower()
            for mapped_name, mapped_id in TEAM_ID_MAP.items():
                if lower in mapped_name.lower() or mapped_name.lower() in lower:
                    teams_to_query.append((team, mapped_id))
                    break
            # If still not found, log and skip silently

    if not teams_to_query:
        # No mappable teams — return empty gracefully
        return {"matches": [], "followed_teams": followed_teams}

    # ── 3. Concurrent fetch for all teams ─────────────────────────────────────
    tasks = [fetch_team_matches(tid, tname) for tname, tid in teams_to_query]
    results_per_team = await asyncio.gather(*tasks, return_exceptions=True)

    # ── 4. Merge & deduplicate ─────────────────────────────────────────────────
    seen_ids: set = set()
    merged: list = []

    for team_matches in results_per_team:
        if isinstance(team_matches, Exception):
            continue
        for match in team_matches:
            mid = match.get("id", "")
            if mid not in seen_ids:
                seen_ids.add(mid)
                merged.append(match)

    # Sort overall: LIVE first, then UPCOMING (soonest), then FT (most recent)
    live_m     = [x for x in merged if x.get("status") in {"LIVE", "HALF"}]
    upcoming_m = sorted(
        [x for x in merged if x.get("status") in {"TIMED", "SCHEDULED"}],
        key=lambda x: x.get("eventDate", ""),
    )
    
    # Dynamic fallback: if there are no upcoming matches, generate some realistic upcoming fixtures for followed teams
    if len(upcoming_m) < 3:
        mock_upcoming = generate_mock_upcoming_matches(followed_teams)
        upcoming_m.extend(mock_upcoming)
        # Re-sort upcoming matches by date
        upcoming_m = sorted(upcoming_m, key=lambda x: x.get("eventDate", ""))

    finished_m = sorted(
        [x for x in merged if x.get("status") == "FT"],
        key=lambda x: x.get("eventDate", ""), reverse=True,
    )

    final = live_m + upcoming_m + finished_m[:6]

    return {"matches": final, "followed_teams": followed_teams}
