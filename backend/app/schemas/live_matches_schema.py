from typing import List, Optional
from pydantic import BaseModel

class GoalDetail(BaseModel):
    minute: Optional[int] = None
    scorer: str
    type: str
    teamId: Optional[int] = None

class BookingDetail(BaseModel):
    minute: Optional[int] = None
    player: str
    card: str
    teamId: Optional[int] = None

class LiveMatchDocument(BaseModel):
    id: str
    homeTeam: str
    awayTeam: str
    homeCrest: Optional[str] = ""
    awayCrest: Optional[str] = ""
    homeScore: int
    awayScore: int
    minute: str
    isLive: bool
    status: str
    events: List[str]
    sourceName: str
    sourceUrl: str
    league: Optional[str] = ""
    venue: Optional[str] = ""
    eventDate: Optional[str] = ""
    goals: Optional[List[GoalDetail]] = []
    bookings: Optional[List[BookingDetail]] = []
    homeTeamId: Optional[int] = None
    awayTeamId: Optional[int] = None

class LiveMatchFeedResponse(BaseModel):
    matches: List[LiveMatchDocument]
    retrieved_at: str
    league: str
    league_label: str
