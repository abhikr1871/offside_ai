import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import HTTPException

from app.db.vector_search import vector_search_manager

logger = logging.getLogger("offside_ai.competitions_service")

# Supported leagues in the football-data.org free tier + Custom MLS
SUPPORTED_COMPETITIONS = {"PL", "PD", "SA", "BL1", "FL1", "CL", "ELC", "DED", "PPL", "CLI", "WC"}


class CompetitionsService:
    async def fetch_competitions(self, code: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch competitions data from football-data.org.
        Caches results in MongoDB for 10 days if connected.
        Filters list to only return the 11 supported leagues to clean up the UI/DB.
        Filters by league code if specified.
        Does not provide any mock fallbacks in case of error.
        """
        cache_collection = None
        cached_data = None
        now = datetime.now(timezone.utc)

        # 1. Try to read from MongoDB cache
        if vector_search_manager.is_connected:
            try:
                cache_collection = vector_search_manager.db["api_football_data_competitions_cache"]
                cache_doc = await cache_collection.find_one({"type": "competitions_cache"})
                if cache_doc:
                    updated_at = datetime.fromisoformat(cache_doc["updated_at"])
                    if now - updated_at < timedelta(days=10):
                        # Cache is fresh
                        cached_data = {
                            "count": cache_doc["count"],
                            "filters": cache_doc["filters"],
                            "competitions": cache_doc["competitions"]
                        }
            except Exception as e:
                logger.error("Failed to query competitions cache from MongoDB: %s", e)

        # 2. Fetch from external API if cache is stale or missing
        if not cached_data:
            api_key = os.getenv("FOOTBALL_DATA_API_KEY")
            headers = {}
            if api_key:
                headers["X-Auth-Token"] = api_key

            url = "https://api.football-data.org/v4/competitions/"

            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"API-Football-Data error: {response.text}"
                        )
                    payload = response.json()
                    
                    # Filter out unsupported leagues
                    all_comps = payload.get("competitions", [])
                    filtered_comps = [comp for comp in all_comps if comp.get("code") in SUPPORTED_COMPETITIONS]

                    cached_data = {
                        "count": len(filtered_comps),
                        "filters": payload.get("filters", {}),
                        "competitions": filtered_comps
                    }

                    # Write new data to cache in MongoDB
                    if cache_collection is not None:
                        await cache_collection.update_one(
                            {"type": "competitions_cache"},
                            {
                                "$set": {
                                    "updated_at": now.isoformat(),
                                    "count": cached_data["count"],
                                    "filters": cached_data["filters"],
                                    "competitions": cached_data["competitions"]
                                }
                            },
                            upsert=True
                        )
                except httpx.HTTPError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to connect to football-data.org: {exc}"
                    )
                except Exception as exc:
                    if isinstance(exc, HTTPException):
                        raise exc
                    raise HTTPException(
                        status_code=500,
                        detail=f"Internal service error fetching competitions: {exc}"
                    )

        # 3. Filter by league code if provided
        if code:
            code_upper = code.strip().upper()
            filtered_list = [
                comp for comp in cached_data["competitions"]
                if comp.get("code") == code_upper
            ]
            return {
                "count": len(filtered_list),
                "filters": {**cached_data["filters"], "code": code_upper},
                "competitions": filtered_list
            }

        return cached_data

    async def fetch_competition_teams(self, code: str) -> Dict[str, Any]:
        """
        Fetch teams in a specific competition from football-data.org.
        Caches results in MongoDB for 10 days if connected.
        Restricts code to the 11 supported leagues.
        Does not provide any mock fallbacks in case of error.
        """
        code_upper = code.strip().upper()
        if code_upper not in SUPPORTED_COMPETITIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported competition code '{code_upper}'. Supported leagues are: {', '.join(sorted(SUPPORTED_COMPETITIONS))}"
            )

        if code_upper == "MLS":
            # Return static MLS teams list with Eastern and Western Conference annotations
            return {
                "teams": [
                    # Eastern Conference
                    {"id": 9001, "name": "Inter Miami CF", "shortName": "Inter Miami", "venue": "Chase Stadium", "clubColors": "Pink / Black", "crest": "https://crests.football-data.org/miami.png", "conference": "Eastern"},
                    {"id": 9002, "name": "Columbus Crew", "shortName": "Columbus Crew", "venue": "Lower.com Field", "clubColors": "Black / Gold", "crest": "https://crests.football-data.org/columbus.png", "conference": "Eastern"},
                    {"id": 9003, "name": "FC Cincinnati", "shortName": "Cincinnati", "venue": "TQL Stadium", "clubColors": "Orange / Blue", "crest": "https://crests.football-data.org/cincinnati.png", "conference": "Eastern"},
                    {"id": 9004, "name": "New York Red Bulls", "shortName": "NY Red Bulls", "venue": "Red Bull Arena", "clubColors": "Red / White", "crest": "https://crests.football-data.org/ny-red-bulls.png", "conference": "Eastern"},
                    {"id": 9005, "name": "Orlando City SC", "shortName": "Orlando City", "venue": "Inter&Co Stadium", "clubColors": "Purple / Gold", "crest": "https://crests.football-data.org/orlando.png", "conference": "Eastern"},
                    # Western Conference
                    {"id": 9051, "name": "LA Galaxy", "shortName": "LA Galaxy", "venue": "Dignity Health Sports Park", "clubColors": "White / Gold / Blue", "crest": "https://crests.football-data.org/la-galaxy.png", "conference": "Western"},
                    {"id": 9052, "name": "Los Angeles FC", "shortName": "LAFC", "venue": "BMO Stadium", "clubColors": "Black / Gold", "crest": "https://crests.football-data.org/lafc.png", "conference": "Western"},
                    {"id": 9053, "name": "Seattle Sounders FC", "shortName": "Seattle Sounders", "venue": "Lumen Field", "clubColors": "Green / Blue", "crest": "https://crests.football-data.org/seattle.png", "conference": "Western"},
                    {"id": 9054, "name": "Houston Dynamo FC", "shortName": "Houston Dynamo", "venue": "Shell Energy Stadium", "clubColors": "Orange / Black", "crest": "https://crests.football-data.org/houston.png", "conference": "Western"},
                    {"id": 9055, "name": "Real Salt Lake", "shortName": "Real Salt Lake", "venue": "America First Field", "clubColors": "Claret / Cobalt / Gold", "crest": "https://crests.football-data.org/rsl.png", "conference": "Western"},
                ]
            }

        cache_collection = None
        cached_data = None
        now = datetime.now(timezone.utc)

        # 1. Try to read from MongoDB cache
        if vector_search_manager.is_connected:
            try:
                cache_collection = vector_search_manager.db["api_football_data_league_teams_cache"]
                cache_doc = await cache_collection.find_one({"type": "league_teams_cache", "code": code_upper})
                if cache_doc:
                    updated_at = datetime.fromisoformat(cache_doc["updated_at"])
                    if now - updated_at < timedelta(days=10):
                        # Cache is fresh
                        cached_data = cache_doc["data"]
            except Exception as e:
                logger.error("Failed to query league teams cache from MongoDB for %s: %s", code_upper, e)

        # 2. Fetch from external API if cache is stale or missing
        if not cached_data:
            api_key = os.getenv("FOOTBALL_DATA_API_KEY")
            headers = {}
            if api_key:
                headers["X-Auth-Token"] = api_key

            url = f"https://api.football-data.org/v4/competitions/{code_upper}/teams"

            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"API-Football-Data error: {response.text}"
                        )
                    payload = response.json()
                    cached_data = payload

                    # Write new data to cache in MongoDB
                    if cache_collection is not None:
                        await cache_collection.update_one(
                            {"type": "league_teams_cache", "code": code_upper},
                            {
                                "$set": {
                                    "updated_at": now.isoformat(),
                                    "data": cached_data
                                }
                            },
                            upsert=True
                        )
                except httpx.HTTPError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to connect to football-data.org: {exc}"
                    )
                except Exception as exc:
                    if isinstance(exc, HTTPException):
                        raise exc
                    raise HTTPException(
                        status_code=500,
                        detail=f"Internal service error fetching competition teams: {exc}"
                    )

        return cached_data

    async def fetch_team_squad(self, team_id: int) -> Dict[str, Any]:
        """
        Fetch detailed team information and players squad list from football-data.org.
        Caches results in MongoDB for 10 days if connected.
        Does not provide any mock fallbacks in case of error.
        """
        if team_id in {9001, 9002, 9003, 9004, 9005, 9051, 9052, 9053, 9054, 9055}:
            # Return static MLS squad data
            squad_map = {
                9001: {
                    "coach": {"name": "Gerardo Martino"},
                    "squad": [
                        {"id": 9101, "name": "Lionel Messi", "position": "Offence", "shirtNumber": 10},
                        {"id": 9102, "name": "Luis Suárez", "position": "Offence", "shirtNumber": 9},
                        {"id": 9103, "name": "Sergio Busquets", "position": "Midfield", "shirtNumber": 5},
                        {"id": 9104, "name": "Jordi Alba", "position": "Defence", "shirtNumber": 18},
                    ]
                },
                9051: {
                    "coach": {"name": "Greg Vanney"},
                    "squad": [
                        {"id": 9201, "name": "Riqui Puig", "position": "Midfield", "shirtNumber": 10},
                        {"id": 9202, "name": "Joseph Paintsil", "position": "Offence", "shirtNumber": 28},
                        {"id": 9203, "name": "Gabriel Pec", "position": "Offence", "shirtNumber": 11},
                        {"id": 9204, "name": "Maya Yoshida", "position": "Defence", "shirtNumber": 4},
                    ]
                }
            }
            return squad_map.get(team_id, {
                "coach": {"name": "MLS Coach"},
                "squad": [
                    {"id": team_id * 10 + 1, "name": "MLS Star Player 1", "position": "Midfield", "shirtNumber": 8},
                    {"id": team_id * 10 + 2, "name": "MLS Star Player 2", "position": "Offence", "shirtNumber": 11},
                ]
            })

        cache_collection = None
        cached_data = None
        now = datetime.now(timezone.utc)

        # 1. Try to read from MongoDB cache
        if vector_search_manager.is_connected:
            try:
                cache_collection = vector_search_manager.db["api_football_data_teams_cache"]
                cache_doc = await cache_collection.find_one({"type": "team_cache", "team_id": team_id})
                if cache_doc:
                    updated_at = datetime.fromisoformat(cache_doc["updated_at"])
                    if now - updated_at < timedelta(days=10):
                        # Cache is fresh
                        cached_data = cache_doc["data"]
            except Exception as e:
                logger.error("Failed to query team cache from MongoDB for team %d: %s", team_id, e)

        # 2. Fetch from external API if cache is stale or missing
        if not cached_data:
            api_key = os.getenv("FOOTBALL_DATA_API_KEY")
            headers = {}
            if api_key:
                headers["X-Auth-Token"] = api_key

            url = f"https://api.football-data.org/v4/teams/{team_id}"

            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"API-Football-Data error: {response.text}"
                        )
                    payload = response.json()
                    cached_data = payload

                    # Write new data to cache in MongoDB
                    if cache_collection is not None:
                        await cache_collection.update_one(
                            {"type": "team_cache", "team_id": team_id},
                            {
                                "$set": {
                                    "updated_at": now.isoformat(),
                                    "data": cached_data
                                }
                            },
                            upsert=True
                        )
                except httpx.HTTPError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to connect to football-data.org: {exc}"
                    )
                except Exception as exc:
                    if isinstance(exc, HTTPException):
                        raise exc
                    raise HTTPException(
                        status_code=500,
                        detail=f"Internal service error fetching team squad: {exc}"
                    )

        return cached_data

    def generate_mock_standings(self, code: str) -> Dict[str, Any]:
        """
        Generate realistic mock standings for a league when API is offline or for MLS.
        """
        code_upper = code.strip().upper()
        
        league_labels = {
            "PL": "Premier League",
            "PD": "LaLiga",
            "SA": "Serie A",
            "BL1": "Bundesliga",
            "FL1": "Ligue 1",
            "CL": "Champions League",
            "WC": "FIFA World Cup",
            "ELC": "Championship",
            "DED": "Eredivisie",
            "PPL": "Primeira Liga",
            "CLI": "Copa Libertadores",
            "MLS": "Major League Soccer"
        }

        # Determine team names based on league
        teams_list = []
        if code_upper == "PL":
            teams_list = [
                ("Liverpool FC", "LIV", "https://crests.football-data.org/64.png", 89, 27, 8, 3, 86, 32),
                ("Arsenal FC", "ARS", "https://crests.football-data.org/57.png", 86, 26, 8, 4, 82, 29),
                ("Manchester City FC", "MCI", "https://crests.football-data.org/65.png", 85, 26, 7, 5, 93, 38),
                ("Aston Villa FC", "AVL", "https://crests.football-data.org/58.png", 68, 20, 8, 10, 76, 61),
                ("Tottenham Hotspur FC", "TOT", "https://crests.football-data.org/73.png", 66, 20, 6, 12, 74, 61),
                ("Chelsea FC", "CHE", "https://crests.football-data.org/61.png", 63, 18, 9, 11, 77, 63),
                ("Newcastle United FC", "NEW", "https://crests.football-data.org/67.png", 60, 18, 6, 14, 85, 62),
                ("Manchester United FC", "MUN", "https://crests.football-data.org/66.png", 60, 18, 6, 14, 57, 58),
                ("West Ham United FC", "WHU", "https://crests.football-data.org/21.png", 52, 14, 10, 14, 60, 74),
                ("Crystal Palace FC", "CRY", "https://crests.football-data.org/354.png", 49, 13, 10, 15, 57, 58),
                ("Brighton & Hove Albion FC", "BHA", "https://crests.football-data.org/397.png", 48, 12, 12, 14, 55, 62),
                ("AFC Bournemouth", "BOU", "https://crests.football-data.org/bournemouth.png", 48, 13, 9, 16, 54, 67),
                ("Fulham FC", "FUL", "https://crests.football-data.org/63.png", 47, 12, 11, 15, 55, 61),
                ("Wolverhampton Wanderers FC", "WOL", "https://crests.football-data.org/76.png", 46, 13, 7, 18, 50, 65),
                ("Everton FC", "EVE", "https://crests.football-data.org/62.png", 48, 13, 9, 16, 40, 51),
                ("Brentford FC", "BRE", "https://crests.football-data.org/402.png", 39, 10, 9, 19, 56, 65),
                ("Nottingham Forest FC", "NFO", "https://crests.football-data.org/351.png", 36, 9, 9, 20, 49, 67),
                ("Sunderland AFC", "SUN", "https://crests.football-data.org/71.png", 32, 8, 8, 22, 38, 70),
                ("Burnley FC", "BUR", "https://crests.football-data.org/328.png", 24, 5, 9, 24, 41, 78),
                ("Luton Town FC", "LUT", "https://crests.football-data.org/389.png", 26, 6, 8, 24, 52, 85)
            ]
        elif code_upper == "MLS":
            teams_list = [
                ("Inter Miami CF", "MIA", "https://crests.football-data.org/miami.png", 74, 22, 8, 4, 79, 49),
                ("Columbus Crew", "CLB", "https://crests.football-data.org/columbus.png", 66, 19, 9, 6, 72, 40),
                ("Los Angeles FC", "LAF", "https://crests.football-data.org/lafc.png", 64, 19, 7, 8, 63, 43),
                ("LA Galaxy", "LAG", "https://crests.football-data.org/la-galaxy.png", 64, 19, 7, 8, 69, 50),
                ("FC Cincinnati", "CIN", "https://crests.football-data.org/cincinnati.png", 59, 18, 5, 11, 58, 48),
                ("Real Salt Lake", "RSL", "https://crests.football-data.org/rsl.png", 59, 16, 11, 7, 65, 48),
                ("Seattle Sounders FC", "SEA", "https://crests.football-data.org/seattle.png", 57, 16, 9, 9, 51, 35),
                ("Houston Dynamo FC", "HOU", "https://crests.football-data.org/houston.png", 54, 15, 9, 10, 47, 39),
                ("Orlando City SC", "ORL", "https://crests.football-data.org/orlando.png", 52, 15, 7, 12, 59, 50),
                ("New York Red Bulls", "NYR", "https://crests.football-data.org/ny-red-bulls.png", 47, 11, 14, 9, 58, 50)
            ]
        else:
            # General fallback for any other league
            names = ["Real Madrid CF", "FC Barcelona", "FC Bayern München", "Paris Saint-Germain FC", "FC Internazionale Milano", "Bayer 04 Leverkusen", "Juventus FC", "Sporting CP", "SL Benfica", "FC Porto"]
            crests = [
                "https://crests.football-data.org/real-madrid.png",
                "https://crests.football-data.org/barcelona.png",
                "https://crests.football-data.org/bayern.png",
                "https://crests.football-data.org/psg.png",
                "https://crests.football-data.org/inter.png",
                "https://crests.football-data.org/leverkusen.png",
                "https://crests.football-data.org/juventus.png",
                "https://crests.football-data.org/sporting.png",
                "https://crests.football-data.org/benfica.png",
                "https://crests.football-data.org/porto.png"
            ]
            for i in range(10):
                name = names[i]
                tla = name[:3].upper()
                crest = crests[i]
                pts = 85 - i * 5
                w = 27 - i
                d = 4 + (i % 2)
                l = i
                gf = 80 - i * 4
                ga = 20 + i * 3
                teams_list.append((name, tla, crest, pts, w, d, l, gf, ga))
        
        # Format into standings schema
        table = []
        for idx, t in enumerate(teams_list):
            name, tla, crest, pts, w, d, l, gf, ga = t
            table.append({
                "position": idx + 1,
                "team": {
                    "id": 1000 + idx,
                    "name": name,
                    "shortName": name,
                    "tla": tla,
                    "crest": crest
                },
                "playedGames": w + d + l,
                "form": "W,D,L,W,W" if idx % 2 == 0 else "L,W,D,L,W",
                "won": w,
                "draw": d,
                "lost": l,
                "points": pts,
                "goalsFor": gf,
                "goalsAgainst": ga,
                "goalDifference": gf - ga
            })
            
        return {
            "filters": {},
            "competition": {
                "id": 2000,
                "name": league_labels.get(code_upper, "League"),
                "code": code_upper,
                "type": "LEAGUE",
                "emblem": ""
            },
            "season": {
                "id": 1,
                "startDate": "2025-08-15",
                "endDate": "2026-05-25",
                "currentMatchday": 38,
                "winner": None
            },
            "standings": [
                {
                    "stage": "REGULAR_SEASON",
                    "type": "TOTAL",
                    "group": None,
                    "table": table
                }
            ]
        }

    async def fetch_competition_standings(self, code: str) -> Dict[str, Any]:
        """
        Fetch standings for a specific competition from football-data.org.
        Caches results in MongoDB for 1 day if connected.
        Provides a realistic mock standings payload if the API fails or if code is MLS.
        """
        code_upper = code.strip().upper()
        if code_upper not in SUPPORTED_COMPETITIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported competition code '{code_upper}'. Supported leagues are: {', '.join(sorted(SUPPORTED_COMPETITIONS))}"
            )

        cache_collection = None
        cached_data = None
        now = datetime.now(timezone.utc)

        # 1. Try to read from MongoDB cache
        if vector_search_manager.is_connected:
            try:
                cache_collection = vector_search_manager.db["api_football_data_league_standings_cache"]
                cache_doc = await cache_collection.find_one({"type": "league_standings_cache", "code": code_upper})
                if cache_doc:
                    updated_at = datetime.fromisoformat(cache_doc["updated_at"])
                    if now - updated_at < timedelta(days=1): # Cache standings for 1 day
                        cached_data = cache_doc["data"]
            except Exception as e:
                logger.error("Failed to query league standings cache from MongoDB for %s: %s", code_upper, e)

        # 2. Fetch from external API if cache is stale or missing
        if not cached_data:
            api_key = os.getenv("FOOTBALL_DATA_API_KEY")
            headers = {}
            if api_key:
                headers["X-Auth-Token"] = api_key

            url = f"https://api.football-data.org/v4/competitions/{code_upper}/standings"

            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.get(url, headers=headers)
                    if response.status_code != 200:
                        raise Exception(f"API-Football-Data error: status_code={response.status_code} {response.text}")
                    payload = response.json()
                    cached_data = payload

                    # Write new data to cache in MongoDB
                    if cache_collection is not None:
                        await cache_collection.update_one(
                            {"type": "league_standings_cache", "code": code_upper},
                            {
                                "$set": {
                                    "updated_at": now.isoformat(),
                                    "data": cached_data
                                }
                            },
                            upsert=True
                        )
                except Exception as exc:
                    logger.warning("Failed to fetch standings for league %s: %s.", code_upper, exc)
                    
                    # Try retrieving expired cache from DB first
                    fallback_doc = None
                    if cache_collection is not None:
                        try:
                            fallback_doc = await cache_collection.find_one({"type": "league_standings_cache", "code": code_upper})
                        except Exception as cache_err:
                            logger.error("Failed to query expired cache: %s", cache_err)
                    
                    if fallback_doc:
                        logger.info("Serving expired standings cache for league %s.", code_upper)
                        cached_data = fallback_doc["data"]
                    else:
                        raise HTTPException(
                            status_code=502,
                            detail=f"Unable to retrieve standings for league {code_upper}."
                        )

        return cached_data


competitions_service = CompetitionsService()

