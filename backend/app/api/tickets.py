"""
Ticket Booking Service
-----------------------
Stores and retrieves user match ticket bookings.
Uses MongoDB when connected, falls back to in-memory store.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.vector_search import vector_search_manager

router = APIRouter(
    prefix="/api/v1/tickets",
    tags=["tickets"],
)




# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class TicketBookingRequest(BaseModel):
    email: str
    match_id: str
    home_team: str
    away_team: str
    home_crest: Optional[str] = ""
    away_crest: Optional[str] = ""
    match_date: Optional[str] = ""
    venue: Optional[str] = ""
    competition: Optional[str] = ""
    league_code: Optional[str] = ""


class TicketDocument(BaseModel):
    booking_id: str
    email: str
    match_id: str
    home_team: str
    away_team: str
    home_crest: Optional[str] = ""
    away_crest: Optional[str] = ""
    match_date: Optional[str] = ""
    venue: Optional[str] = ""
    competition: Optional[str] = ""
    league_code: Optional[str] = ""
    booked_at: str
    status: str = "CONFIRMED"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/book", response_model=TicketDocument)
async def book_ticket(req: TicketBookingRequest):
    """
    Creates a new ticket booking for the given user and match.
    Requires MongoDB connection.
    """
    if vector_search_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="Ticket service is unavailable. MongoDB connection required."
        )

    email = req.email.strip().lower()
    booking_id = str(uuid.uuid4())[:8].upper()
    booked_at = datetime.now(timezone.utc).isoformat()

    booking_doc: Dict[str, Any] = {
        "booking_id": booking_id,
        "email": email,
        "match_id": req.match_id,
        "home_team": req.home_team,
        "away_team": req.away_team,
        "home_crest": req.home_crest or "",
        "away_crest": req.away_crest or "",
        "match_date": req.match_date or "",
        "venue": req.venue or "",
        "competition": req.competition or "",
        "league_code": req.league_code or "",
        "booked_at": booked_at,
        "status": "CONFIRMED",
    }

    try:
        col = vector_search_manager.db["ticket_bookings"]
        await col.insert_one({**booking_doc, "_id": booking_id})
        return booking_doc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to book ticket: {str(exc)}"
        )


@router.get("/", response_model=List[TicketDocument])
async def get_user_tickets(email: str):
    """
    Returns all booked tickets for the specified user email.
    Requires MongoDB connection.
    """
    if vector_search_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="Ticket service is unavailable. MongoDB connection required."
        )

    email = email.strip().lower()

    try:
        col = vector_search_manager.db["ticket_bookings"]
        cursor = col.find({"email": email}, {"_id": 0})
        docs = await cursor.to_list(length=100)
        return docs
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve tickets: {str(exc)}"
        )


@router.delete("/{booking_id}")
async def cancel_ticket(booking_id: str, email: str):
    """
    Cancels (removes) a booked ticket by booking_id for the given user.
    Requires MongoDB connection.
    """
    if vector_search_manager.db is None:
        raise HTTPException(
            status_code=503,
            detail="Ticket service is unavailable. MongoDB connection required."
        )

    email = email.strip().lower()

    try:
        col = vector_search_manager.db["ticket_bookings"]
        result = await col.delete_one({"booking_id": booking_id, "email": email})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found.")
        return {"status": "cancelled", "booking_id": booking_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel ticket: {str(exc)}"
        )
