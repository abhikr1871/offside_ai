"""
Team Matches Helper
-------------------
Fetches upcoming / recent matches for a specific football-data.org team
via GET /v4/teams/{teamId}/matches and normalises the response.
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

import httpx

from app.db.vector_search import vector_search_manager

logger = logging.getLogger("offside_ai.team_matches_helper")

LEAGUE_LABELS = {
    "PL": "Premier League", "PD": "LaLiga", "SA": "Serie A",
    "BL1": "Bundesliga", "FL1": "Ligue 1", "CL": "Champions League",
    "WC": "FIFA World Cup", "ELC": "Championship", "DED": "Eredivisie",
    "PPL": "Primeira Liga", "CLI": "Copa Libertadores", "MLS": "Major League Soccer",
}

# football-data.org team IDs — used to call /v4/teams/{id}/matches
TEAM_ID_MAP: Dict[str, int] = {
    # Premier League
    "Arsenal": 57,
    "Chelsea": 61,
    "Liverpool": 64,
    "Manchester City": 65,
    "Manchester United": 66,
    "Tottenham Hotspur": 73,
    "Aston Villa": 58,
    "Newcastle United": 67,
    "West Ham United": 563,
    "Brighton & Hove Albion": 397,
    "Brighton": 397,
    "Brentford": 402,
    "Fulham": 63,
    "Wolverhampton Wanderers": 76,
    "Crystal Palace": 354,
    "Nottingham Forest": 351,
    "Bournemouth": 1044,
    "Everton": 62,
    "Leicester City": 338,
    "Ipswich Town": 349,
    # La Liga
    "Real Madrid CF": 86,
    "FC Barcelona": 81,
    "Club Atlético de Madrid": 78,
    "Real Sociedad de Fútbol": 92,
    "Sevilla FC": 95,
    "Girona FC": 298,
    "Real Betis Balompié": 90,
    "Athletic Club": 77,
    "Villarreal CF": 94,
    # Serie A
    "Juventus FC": 109,
    "FC Internazionale Milano": 108,
    "AC Milan": 98,
    "SSC Napoli": 113,
    "AS Roma": 100,
    "SS Lazio": 110,
    "ACF Fiorentina": 99,
    "Atalanta BC": 102,
    "Bologna FC 1909": 103,
    # Bundesliga
    "FC Bayern München": 5,
    "Borussia Dortmund": 4,
    "Bayer 04 Leverkusen": 3,
    "RB Leipzig": 721,
    "VfB Stuttgart": 10,
    "Eintracht Frankfurt": 9,
    "SC Freiburg": 17,
    "TSG 1899 Hoffenheim": 720,
    "1. FC Union Berlin": 28,
    # Ligue 1
    "Paris Saint-Germain FC": 524,
    "PSG": 524,
    "Paris Saint-Germain": 524,
    "Olympique de Marseille": 516,
    "AS Monaco FC": 548,
    "LOSC Lille": 521,
    "OGC Nice": 522,
    "Olympique Lyonnais": 523,
    # National Teams
    "Germany": 759,
}


async def fetch_team_matches(team_id: int, team_name: str) -> List[Dict[str, Any]]:
    """
    Calls GET https://api.football-data.org/v4/teams/{team_id}/matches
    and returns a normalised list of match dicts.

    The API response structure (abbreviated):
      {
        "matches": [
          {
            "id": 391905,
            "utcDate": "2022-11-23T13:00:00Z",
            "status": "TIMED",          // TIMED | SCHEDULED | IN_PLAY | PAUSED | FINISHED
            "minute": null,
            "venue": "Khalifa International Stadium",
            "competition": { "id": 2000, "name": "FIFA World Cup", "code": "WC", ... },
            "homeTeam": { "id": 759, "name": "Germany", "shortName": "Germany", "crest": "..." },
            "awayTeam": { "id": 766, "name": "Japan",   "shortName": "Japan",   "crest": "..." },
            "score": {
              "fullTime": { "home": null, "away": null }
            },
            "goals": [],
            "bookings": []
          }
        ]
      }
    """
    now = datetime.now(timezone.utc)
    cache_key = f"team_matches_{team_id}"
    cache_collection = None

    # ---------- 1. Try MongoDB cache (30-minute TTL) ----------
    if vector_search_manager.is_connected:
        try:
            cache_collection = vector_search_manager.db["api_team_matches_cache"]
            cached = await cache_collection.find_one({"cache_key": cache_key})
            if cached:
                updated_at = datetime.fromisoformat(cached["updated_at"])
                if now - updated_at < timedelta(minutes=30):
                    logger.info("Cache hit: team_matches for team_id=%s", team_id)
                    return cached["matches"]
        except Exception as e:
            logger.error("Team matches cache read error: %s", e)

    # ---------- 2. Call football-data.org ----------
    api_key = os.getenv("FOOTBALL_DATA_API_KEY")
    req_headers: Dict[str, str] = {}
    if api_key:
        req_headers["X-Auth-Token"] = api_key

    url = f"https://api.football-data.org/v4/teams/{team_id}/matches"
    raw_matches: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(url, headers=req_headers)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"football-data.org returned HTTP {resp.status_code} "
                    f"for /teams/{team_id}/matches: {resp.text[:200]}"
                )
            raw_matches = resp.json().get("matches", [])
    except Exception as exc:
        logger.warning(
            "Failed to fetch /teams/%s/matches for '%s': %s. Falling back to stale cache.",
            team_id, team_name, exc,
        )
        if cache_collection is not None:
            try:
                stale = await cache_collection.find_one({"cache_key": cache_key})
                if stale:
                    return stale["matches"]
            except Exception:
                pass
        return []

    # ---------- 3. Normalise to frontend schema ----------
    normalized: List[Dict[str, Any]] = []
    for m in raw_matches:
        status_raw = (m.get("status") or "TIMED").upper()

        if status_raw in {"IN_PLAY", "LIVE"}:
            status_norm = "LIVE"
            minute = str(m.get("minute") or "Live")
        elif status_raw == "PAUSED":
            status_norm = "HALF"
            minute = "HT"
        elif status_raw == "FINISHED":
            status_norm = "FT"
            minute = "FT"
        else:
            # TIMED / SCHEDULED / POSTPONED / etc.
            status_norm = status_raw
            minute = ""

        ht = m.get("homeTeam") or {}
        at = m.get("awayTeam") or {}
        home_name  = ht.get("shortName") or ht.get("name") or "TBD"
        away_name  = at.get("shortName") or at.get("name") or "TBD"
        home_crest = ht.get("crest") or ""
        away_crest = at.get("crest") or ""
        home_id    = ht.get("id")
        away_id    = at.get("id")

        ft_score   = (m.get("score") or {}).get("fullTime") or {}
        home_score = ft_score.get("home") if ft_score.get("home") is not None else 0
        away_score = ft_score.get("away") if ft_score.get("away") is not None else 0

        comp        = m.get("competition") or {}
        league_code = comp.get("code") or "UNK"
        league_name = comp.get("name") or LEAGUE_LABELS.get(league_code, league_code)

        normalized_goals = [
            {
                "minute": g.get("minute"),
                "scorer": (g.get("scorer") or {}).get("name") or "Unknown",
                "type":   g.get("type") or "REGULAR",
                "teamId": (g.get("team") or {}).get("id"),
            }
            for g in (m.get("goals") or [])
        ]
        normalized_bookings = [
            {
                "minute": b.get("minute"),
                "player": (b.get("player") or {}).get("name") or "Unknown",
                "card":   b.get("card") or "YELLOW",
                "teamId": (b.get("team") or {}).get("id"),
            }
            for b in (m.get("bookings") or [])
        ]

        normalized.append({
            "id":          str(m.get("id")),
            "homeTeam":    home_name,
            "awayTeam":    away_name,
            "homeCrest":   home_crest,
            "awayCrest":   away_crest,
            "homeTeamId":  home_id,
            "awayTeamId":  away_id,
            "homeScore":   home_score,
            "awayScore":   away_score,
            "minute":      minute,
            "isLive":      status_norm in {"LIVE", "HALF"},
            "status":      status_norm,
            "venue":       m.get("venue") or "",
            "eventDate":   m.get("utcDate") or "",
            "league":      league_name,
            "league_code": league_code,
            "goals":       normalized_goals,
            "bookings":    normalized_bookings,
            "sourceName":  "Football-Data.org",
        })

    # ---------- 4. Sort: live → upcoming → finished ----------
    live_m     = [x for x in normalized if x["status"] in {"LIVE", "HALF"}]
    upcoming_m = sorted(
        [x for x in normalized if x["status"] in {"TIMED", "SCHEDULED"}],
        key=lambda x: x["eventDate"],
    )
    finished_m = sorted(
        [x for x in normalized if x["status"] == "FT"],
        key=lambda x: x["eventDate"], reverse=True,
    )
    result = live_m + upcoming_m[:5] + finished_m[:3]

    # ---------- 5. Write back to cache ----------
    if cache_collection is not None:
        try:
            await cache_collection.update_one(
                {"cache_key": cache_key},
                {"$set": {
                    "cache_key":  cache_key,
                    "team_id":    team_id,
                    "team_name":  team_name,
                    "updated_at": now.isoformat(),
                    "matches":    result,
                }},
                upsert=True,
            )
        except Exception as e:
            logger.error("Team matches cache write error: %s", e)

    return result
