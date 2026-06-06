import hashlib
import uuid
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.vector_search import vector_search_manager

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)

class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# In-memory mock database fallback
MOCK_USERS_DB = {}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/signup")
async def signup(user_data: UserSignup):
    email = user_data.email.strip().lower()
    name = user_data.name.strip()
    password = user_data.password

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Missing required signup details.")

    # 1. If MongoDB is connected, store in MongoDB database
    if vector_search_manager.db is not None:
        try:
            users_col = vector_search_manager.db["users"]
            existing_user = await users_col.find_one({"email": email})
            if existing_user:
                raise HTTPException(status_code=400, detail="An account with this email already exists.")

            user_id = str(uuid.uuid4())
            hashed = hash_password(password)
            user_doc = {
                "id": user_id,
                "name": name,
                "email": email,
                "password": hashed,
            }
            await users_col.insert_one(user_doc)
            return {
                "id": user_id,
                "name": name,
                "email": email
            }
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise exc
            raise HTTPException(status_code=500, detail=f"Database error during signup: {str(exc)}")
    
    # 2. Fallback in-memory mock database
    if email in MOCK_USERS_DB:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_id = str(uuid.uuid4())
    MOCK_USERS_DB[email] = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": hash_password(password)
    }
    return {
        "id": user_id,
        "name": name,
        "email": email
    }

@router.post("/login")
async def login(user_data: UserLogin):
    email = user_data.email.strip().lower()
    password = user_data.password

    # 1. If MongoDB is connected, verify in MongoDB database
    if vector_search_manager.db is not None:
        try:
            users_col = vector_search_manager.db["users"]
            user = await users_col.find_one({"email": email})
            if not user:
                raise HTTPException(status_code=400, detail="Invalid email or password.")

            hashed = hash_password(password)
            if user["password"] != hashed:
                raise HTTPException(status_code=400, detail="Invalid email or password.")

            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise exc
            raise HTTPException(status_code=500, detail=f"Database error during login: {str(exc)}")

    # 2. Fallback in-memory mock database
    if email not in MOCK_USERS_DB:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    user = MOCK_USERS_DB[email]
    hashed = hash_password(password)
    if user["password"] != hashed:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }

class UserProfileUpdate(BaseModel):
    email: str
    followed_teams: List[str] = []
    favorite_players: List[str] = []
    country: str = ""
    city: str = ""
    stadium: str = ""
    street: str = ""

@router.put("/profile")
async def update_profile(profile: UserProfileUpdate):
    email = profile.email.strip().lower()

    # 1. If MongoDB is connected, store profile details in MongoDB database
    if vector_search_manager.db is not None:
        try:
            users_col = vector_search_manager.db["users"]
            user = await users_col.find_one({"email": email})
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")

            await users_col.update_one(
                {"email": email},
                {"$set": {
                    "followed_teams": profile.followed_teams,
                    "favorite_players": profile.favorite_players,
                    "country": profile.country,
                    "city": profile.city,
                    "stadium": profile.stadium,
                    "street": profile.street,
                    "onboarded": True
                }}
            )
            return {"status": "success", "message": "Profile updated successfully."}
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise exc
            raise HTTPException(status_code=500, detail=f"Database error during profile update: {str(exc)}")

    # 2. Fallback in-memory mock database
    if email not in MOCK_USERS_DB:
        raise HTTPException(status_code=404, detail="User not found.")

    MOCK_USERS_DB[email].update({
        "followed_teams": profile.followed_teams,
        "favorite_players": profile.favorite_players,
        "country": profile.country,
        "city": profile.city,
        "stadium": profile.stadium,
        "street": profile.street,
        "onboarded": True
    })
    return {"status": "success", "message": "Profile updated successfully (mock)."}
