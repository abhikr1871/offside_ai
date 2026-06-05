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


competitions_service = CompetitionsService()
