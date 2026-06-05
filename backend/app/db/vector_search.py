import os
import logging
import math
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("offside_ai.vector_search")

# Environment configurations
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "offside_ai")
APP_MODE = os.getenv("APP_MODE", "club")
COLLECTION_NAME = "club_2026_schedule" if APP_MODE == "club" else "fifa_2026_schedule"

# Mock schedule database for World Cup operation
MOCK_WORLDCUP_SCHEDULE: List[Dict[str, Any]] = [
    {
        "match_no": 1,
        "stage": "Group Stage - Group A",
        "date": "2026-06-11",
        "time": "18:00 Local",
        "home_team": "Mexico",
        "away_team": "TBD",
        "venue": "Estadio Azteca",
        "city": "Mexico City",
        "country": "Mexico"
    },
    {
        "match_no": 2,
        "stage": "Group Stage - Group B",
        "date": "2026-06-12",
        "time": "19:30 Local",
        "home_team": "Canada",
        "away_team": "TBD",
        "venue": "BMO Field",
        "city": "Toronto",
        "country": "Canada"
    },
    {
        "match_no": 3,
        "stage": "Group Stage - Group D",
        "date": "2026-06-12",
        "time": "20:00 Local",
        "home_team": "United States",
        "away_team": "TBD",
        "venue": "SoFi Stadium",
        "city": "Los Angeles",
        "country": "United States"
    },
    {
        "match_no": 11,
        "stage": "Group Stage - Group A",
        "date": "2026-06-15",
        "time": "17:00 Local",
        "home_team": "Mexico",
        "away_team": "TBD",
        "venue": "Estadio BBVA",
        "city": "Monterrey",
        "country": "Mexico"
    },
    {
        "match_no": 15,
        "stage": "Group Stage - Group D",
        "date": "2026-06-16",
        "time": "19:00 Local",
        "home_team": "United States",
        "away_team": "TBD",
        "venue": "Lumen Field",
        "city": "Seattle",
        "country": "United States"
    },
    {
        "match_no": 101,
        "stage": "Quarter-finals",
        "date": "2026-07-09",
        "time": "16:00 Local",
        "home_team": "Winner Match 89",
        "away_team": "Winner Match 90",
        "venue": "Gillette Stadium",
        "city": "Boston",
        "country": "United States"
    },
    {
        "match_no": 102,
        "stage": "Quarter-finals",
        "date": "2026-07-10",
        "time": "18:00 Local",
        "home_team": "Winner Match 91",
        "away_team": "Winner Match 92",
        "venue": "SoFi Stadium",
        "city": "Los Angeles",
        "country": "United States"
    },
    {
        "match_no": 103,
        "stage": "Semi-finals",
        "date": "2026-07-14",
        "time": "19:00 Local",
        "home_team": "Winner Match 97",
        "away_team": "Winner Match 98",
        "venue": "AT&T Stadium",
        "city": "Dallas",
        "country": "United States"
    },
    {
        "match_no": 104,
        "stage": "Semi-finals",
        "date": "2026-07-15",
        "time": "19:00 Local",
        "home_team": "Winner Match 99",
        "away_team": "Winner Match 100",
        "venue": "Mercedes-Benz Stadium",
        "city": "Atlanta",
        "country": "United States"
    },
    {
        "match_no": 105,
        "stage": "Third Place Match",
        "date": "2026-07-18",
        "time": "15:00 Local",
        "home_team": "Loser Match 103",
        "away_team": "Loser Match 104",
        "venue": "Hard Rock Stadium",
        "city": "Miami",
        "country": "United States"
    },
    {
        "match_no": 106,
        "stage": "Final",
        "date": "2026-07-19",
        "time": "16:00 Local",
        "home_team": "Winner Match 103",
        "away_team": "Winner Match 104",
        "venue": "MetLife Stadium",
        "city": "East Rutherford",
        "country": "United States"
    }
]

# Mock schedule database for Club League operation
MOCK_CLUB_SCHEDULE: List[Dict[str, Any]] = [
    {
        "match_no": 1,
        "stage": "Premier League",
        "date": "2026-05-17",
        "time": "15:00 GMT",
        "home_team": "Manchester City",
        "away_team": "Arsenal",
        "venue": "Etihad Stadium",
        "city": "Manchester",
        "country": "England"
    },
    {
        "match_no": 2,
        "stage": "Premier League",
        "date": "2026-05-17",
        "time": "15:00 GMT",
        "home_team": "Chelsea",
        "away_team": "Manchester United",
        "venue": "Stamford Bridge",
        "city": "London",
        "country": "England"
    },
    {
        "match_no": 3,
        "stage": "LaLiga",
        "date": "2026-05-10",
        "time": "20:00 CET",
        "home_team": "Real Madrid",
        "away_team": "Barcelona",
        "venue": "Santiago Bernabeu",
        "city": "Madrid",
        "country": "Spain"
    },
    {
        "match_no": 4,
        "stage": "LaLiga",
        "date": "2026-05-16",
        "time": "18:30 CET",
        "home_team": "Atletico Madrid",
        "away_team": "Sevilla",
        "venue": "Metropolitano Stadium",
        "city": "Madrid",
        "country": "Spain"
    },
    {
        "match_no": 5,
        "stage": "Serie A",
        "date": "2026-05-10",
        "time": "20:45 CET",
        "home_team": "Inter Milan",
        "away_team": "AC Milan",
        "venue": "San Siro",
        "city": "Milan",
        "country": "Italy"
    },
    {
        "match_no": 6,
        "stage": "Serie A",
        "date": "2026-05-17",
        "time": "18:00 CET",
        "home_team": "Juventus",
        "away_team": "Napoli",
        "venue": "Allianz Stadium",
        "city": "Turin",
        "country": "Italy"
    },
    {
        "match_no": 7,
        "stage": "UEFA Europa League - Final",
        "date": "2026-05-27",
        "time": "20:00 BST",
        "home_team": "Arsenal",
        "away_team": "Bayer Leverkusen",
        "venue": "Dublin Arena",
        "city": "Dublin",
        "country": "Ireland"
    },
    {
        "match_no": 8,
        "stage": "UEFA Champions League - Final",
        "date": "2026-05-30",
        "time": "21:00 CET",
        "home_team": "Real Madrid",
        "away_team": "Manchester City",
        "venue": "San Siro",
        "city": "Milan",
        "country": "Italy"
    },
    {
        "match_no": 9,
        "stage": "MLS",
        "date": "2026-05-30",
        "time": "19:30 EST",
        "home_team": "Inter Miami",
        "away_team": "LA Galaxy",
        "venue": "Chase Stadium",
        "city": "Fort Lauderdale",
        "country": "United States"
    },
    {
        "match_no": 10,
        "stage": "MLS",
        "date": "2026-06-06",
        "time": "19:00 PST",
        "home_team": "LAFC",
        "away_team": "Seattle Sounders",
        "venue": "BMO Stadium",
        "city": "Los Angeles",
        "country": "United States"
    },
    {
        "match_no": 11,
        "stage": "MLS",
        "date": "2026-06-13",
        "time": "19:30 EST",
        "home_team": "Columbus Crew",
        "away_team": "New York Red Bulls",
        "venue": "Lower.com Field",
        "city": "Columbus",
        "country": "United States"
    }
]

MOCK_SCHEDULE = MOCK_CLUB_SCHEDULE if APP_MODE == "club" else MOCK_WORLDCUP_SCHEDULE

class VectorSearchManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self.is_connected = False
        
        if MONGODB_URI:
            try:
                self.client = AsyncIOMotorClient(MONGODB_URI)
                self.db = self.client[DB_NAME]
                self.collection = self.db[COLLECTION_NAME]
                self.is_connected = True
                logger.info("Successfully initialized MongoDB Atlas connection.")
            except Exception as e:
                logger.error(f"Error initializing MongoDB Client: {e}. Defaulting to mock fallback.")
        else:
            logger.info("MONGODB_URI not provided. Running in Local Mock Fallback Mode.")

    async def search_similar_schedules(self, query_vector: List[float], query_text: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Executes a vector search query against MongoDB Atlas Vector Search.
        If MongoDB is not connected, falls back to a clean keyword-based similarity search over the mock data.
        """
        if self.is_connected and query_vector:
            try:
                # MongoDB Atlas Vector Search Aggregation Pipeline
                pipeline = [
                    {
                        "$vectorSearch": {
                            "index": "vector_index", # Atlas Vector Search Index Name
                            "path": "embedding",
                            "queryVector": query_vector,
                            "numCandidates": limit * 10,
                            "limit": limit
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "match_no": 1,
                            "stage": 1,
                            "date": 1,
                            "time": 1,
                            "home_team": 1,
                            "away_team": 1,
                            "venue": 1,
                            "city": 1,
                            "country": 1,
                            "score": {"$meta": "vectorSearchScore"}
                        }
                    }
                ]
                cursor = self.collection.aggregate(pipeline)
                results = await cursor.to_list(length=limit)
                if results:
                    return results
            except Exception as e:
                logger.error(f"MongoDB Vector Search aggregation failed: {e}. Falling back to mock search.")
        
        # Local mock keyword search fallback
        return self._local_mock_search(query_text, limit)

    def _local_mock_search(self, query_text: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Calculates simple tf-idf or overlap score for mock search fallback.
        """
        query_words = set(query_text.lower().split())
        scored_matches = []

        for match in MOCK_SCHEDULE:
            match_string = f"{match['stage']} {match['home_team']} {match['away_team']} {match['venue']} {match['city']} {match['country']} {match['date']}".lower()
            # Calculate match overlap score
            score = 0.0
            for word in query_words:
                if word in match_string:
                    score += 1.0
            # Higher weight if match number is mentioned
            for word in query_words:
                if word.isdigit() and int(word) == match['match_no']:
                    score += 5.0
            
            if score > 0:
                scored_matches.append((score, match))

        # Sort by score descending
        scored_matches.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scored_matches[:limit]]
        
        # If no keywords matched, return top default matches
        if not results:
            results = MOCK_SCHEDULE[:limit]
            
        return results

    async def get_all_schedules(self) -> List[Dict[str, Any]]:
        """
        Returns all schedule data for the listing view.
        """
        if self.is_connected:
            try:
                cursor = self.collection.find({}, {"_id": 0, "embedding": 0})
                results = await cursor.to_list(length=100)
                if results:
                    return results
            except Exception as e:
                logger.error(f"Failed to fetch schedules from MongoDB: {e}")
        
        return MOCK_SCHEDULE

vector_search_manager = VectorSearchManager()
