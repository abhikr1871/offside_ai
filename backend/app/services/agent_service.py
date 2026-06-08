import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List
from app.db.vector_search import vector_search_manager
from app.api.auth import MOCK_USERS_DB

# Try imports for Vertex AI
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    HAS_VERTEX_AI = True
except ImportError:
    HAS_VERTEX_AI = False

# Try imports for Google Generative AI (AI Studio)
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class AgentService:
    def __init__(self) -> None:
        self.system_instruction = ""
        
        # Load system instructions dynamically from root agent specs
        root_dir = Path(__file__).resolve().parents[3]
        instruction_path = root_dir / "agents" / "globus-2026" / "system-instruction.md"
        
        try:
            if instruction_path.exists():
                with instruction_path.open("r", encoding="utf-8") as f:
                    self.system_instruction = f.read()
            else:
                self.system_instruction = "You are Globus 2026, an autonomous logistics agent."
        except Exception as exc:
            self.system_instruction = f"You are Globus 2026, an autonomous logistics agent. (Init error: {exc})"

        # Initialize Gemini Model if configured
        self.genai_initialized = False
        self.vertex_initialized = False
        self.llm_model = None

        api_key = os.getenv("GEMINI_API_KEY")
        if HAS_GENAI and api_key:
            try:
                genai.configure(api_key=api_key)
                self.llm_model = genai.GenerativeModel("gemini-1.5-pro")
                self.genai_initialized = True
            except Exception:
                pass

        gcp_project = os.getenv("GCP_PROJECT")
        if not self.genai_initialized and HAS_VERTEX_AI and gcp_project:
            try:
                vertexai.init(project=gcp_project, location=os.getenv("GCP_LOCATION", "us-central1"))
                self.llm_model = GenerativeModel("gemini-1.5-pro")
                self.vertex_initialized = True
            except Exception:
                pass

    async def get_user_profile(self, email: str) -> Dict[str, Any]:
        """Fetch user profile from MongoDB or mock DB fallback"""
        normalized_email = email.strip().lower()
        
        if vector_search_manager.db is not None:
            try:
                users_col = vector_search_manager.db["users"]
                user = await users_col.find_one({"email": normalized_email})
                if user:
                    return {
                        "name": user.get("name", "User"),
                        "followed_teams": user.get("followed_teams", []),
                        "favorite_players": user.get("favorite_players", []),
                        "country": user.get("country", ""),
                        "city": user.get("city", ""),
                        "stadium": user.get("stadium", ""),
                        "street": user.get("street", "")
                    }
            except Exception:
                pass
                
        # Mock DB fallback
        if normalized_email in MOCK_USERS_DB:
            user = MOCK_USERS_DB[normalized_email]
            return {
                "name": user.get("name", "User"),
                "followed_teams": user.get("followed_teams", []),
                "favorite_players": user.get("favorite_players", []),
                "country": user.get("country", ""),
                "city": user.get("city", ""),
                "stadium": user.get("stadium", ""),
                "street": user.get("street", "")
            }
            
        return {
            "name": "Guest Fan",
            "followed_teams": ["Arsenal"],
            "favorite_players": ["Lionel Messi"],
            "country": "United Kingdom",
            "city": "London",
            "stadium": "Emirates Stadium",
            "street": "Highbury Hill"
        }

    async def run_chat(self, email: str, query: str) -> Dict[str, Any]:
        """
        Simulate the LangGraph orchestration node workflow:
        1. Read state & profile dependencies
        2. Determine target tools (MCP Server)
        3. Call tools & synthesize results in official Globus markdown format
        """
        profile = await self.get_user_profile(email)
        query_lower = query.lower()
        
        tool_calls_made = []
        action_details = []
        
        # Extract target stadium from query if mentioned, else fallback to profile
        if "emirates" in query_lower:
            target_stadium = "Emirates Stadium"
        elif "anfield" in query_lower:
            target_stadium = "Anfield"
        elif "bernabeu" in query_lower or "bernabéu" in query_lower:
            target_stadium = "Santiago Bernabéu"
        else:
            target_stadium = profile.get("stadium") or "Emirates Stadium"
            
        user_city = profile.get("city") or "London"
        
        from app.mcp.stay_mcp_client import StayMCPClient
        client = StayMCPClient()
        
        try:
            await client.connect()
        except Exception as exc:
            return {
                "reply": f"⚠️ **Globus 2026 Connection Error**: Could not connect to logistics MCP service. Details: {exc}",
                "profile": profile,
                "tool_calls": []
            }
            
        try:
            # 1. Check if query is about Hostels/Hotels/Accommodation/Airbnb/Staying
            if any(w in query_lower for w in ["hostel", "hotel", "stay", "accommodation", "room", "airbnb", "lodging"]):
                types_to_include = []
                if "hotel" in query_lower:
                    types_to_include.append("hotel")
                if "hostel" in query_lower:
                    types_to_include.append("hostel")
                if "shared" in query_lower or "sharing" in query_lower or "dorm" in query_lower:
                    types_to_include.append("shared_room")
                if "airbnb" in query_lower or "apartment" in query_lower:
                    types_to_include.append("airbnb")
                    
                if len(types_to_include) == 1:
                    acc_type = types_to_include[0]
                else:
                    acc_type = "all"
                    
                max_price = None
                price_match = re.search(r'(?:under|below|max|budget)?\s*\$?\s*(\d+)\s*(?:usd|dollars)?', query_lower)
                if price_match:
                    extracted = int(price_match.group(1))
                    if extracted < 1000:  # Avoid matching years
                        max_price = extracted
                
                min_rating = None
                rating_match = re.search(r'(?:rating|stars?)\s*(?:above|over|of|at least|>=|>)?\s*([0-9.]+)', query_lower)
                if rating_match:
                    try:
                        min_rating = float(rating_match.group(1))
                    except ValueError:
                        pass
                
                sort_by = "price"
                if "rating" in query_lower:
                    sort_by = "rating"
                
                req_amenities = []
                if "wifi" in query_lower:
                    req_amenities.append("WiFi")
                if "breakfast" in query_lower:
                    req_amenities.append("Free Breakfast")
                if "kitchen" in query_lower:
                    req_amenities.append("Kitchen")
                if "ac" in query_lower or "air cond" in query_lower:
                    req_amenities.append("AC")
                if "pool" in query_lower:
                    req_amenities.append("Pool")
                if "gym" in query_lower:
                    req_amenities.append("Gym")
                if "bar" in query_lower:
                    req_amenities.append("Bar")
                    
                arguments = {
                    "stadium": target_stadium,
                    "accommodation_type": acc_type
                }
                if max_price is not None:
                    arguments["max_price"] = max_price
                if min_rating is not None:
                    arguments["min_rating"] = min_rating
                if req_amenities:
                    arguments["required_amenities"] = req_amenities
                if sort_by != "price":
                    arguments["sort_by"] = sort_by
                    
                tool_calls_made.append({
                    "name": "search_stays",
                    "arguments": arguments
                })
                res = await client.call_tool("search_stays", arguments)
                
                # Post-filter if multiple specific types were requested but tool had to query "all"
                if len(types_to_include) > 1 and res.get("status") == "success" and "stays" in res:
                    res["stays"] = [s for s in res["stays"] if s["type"] in types_to_include]
                    
                action_details.append(res)
                
            # 2. Check if query is about Directions/Route/Travel
            if any(w in query_lower for w in ["directions", "route", "travel", "metro", "cab", "walk", "get to"]):
                dir_args = {"origin": user_city, "destination": target_stadium, "mode": "transit"}
                tool_calls_made.append({
                    "name": "get_directions",
                    "arguments": dir_args
                })
                res = await client.call_tool("get_directions", dir_args)
                action_details.append(res)
                
            # 3. Check if query is about Reviews/Food/Drinks
            if any(w in query_lower for w in ["food", "drink", "pub", "restaurant", "review", "pie"]):
                rev_args = {"venue": target_stadium}
                tool_calls_made.append({
                    "name": "get_food_reviews",
                    "arguments": rev_args
                })
                res = await client.call_tool("get_food_reviews", rev_args)
                action_details.append(res)
                
            # 4. Check if query is about Match/Schedule/Fixtures
            if any(w in query_lower for w in ["match", "fixture", "schedule", "game", "upcoming"]):
                target_team = profile.get("followed_teams")[0] if profile.get("followed_teams") else "Arsenal"
                match_args = {"team_name": target_team}
                tool_calls_made.append({
                    "name": "get_team_matches",
                    "arguments": match_args
                })
                res = await client.call_tool("get_team_matches", match_args)
                action_details.append(res)
        finally:
            await client.disconnect()

        # Synthesize markdown response utilizing the official Globus 2026 layout template
        markdown_reply = self._synthesize_response(query, profile, tool_calls_made, action_details)
        
        return {
            "reply": markdown_reply,
            "profile": profile,
            "tool_calls": tool_calls_made
        }

    def _synthesize_response(self, query: str, profile: Dict[str, Any], tools: List[Dict], details: List[Dict]) -> str:
        # Default greeting if no tools triggered
        if not tools:
            return f"""### Operations Briefing
Welcome **{profile.get('name')}**. I am **Globus 2026**, your autonomous World Cup logistics coordinator.

I am ready to assist you with operations details:
- **Staying Places Comparison**: Search hotels, hostels, airbnbs, shared rooms near `{profile.get('stadium', 'Emirates Stadium')}`.
- **Route Service**: Directions from `{profile.get('city', 'London')}` to match gates.
- **Review Service**: Pubs & food review listings.
- **Match Service**: Schedules for followed teams `{", ".join(profile.get('followed_teams', []))}`.

*How can I assist your logistics today? (e.g. ask "Compare airbnbs near Emirates Stadium under $80" or "Get directions")*"""

        # Build responses based on tools triggered
        sections = []
        sections.append(f"### Globus 2026 Logistics Dispatch")
        sections.append(f"**Objective**: Resolve user logistics query: *\"{query}\"*")
        
        current_sit = f"User **{profile.get('name')}** is located in **{profile.get('city')}** following **{', '.join(profile.get('followed_teams', []))}**. Favorite stadium is **{profile.get('stadium')}**."
        sections.append(f"**Current Situation**: {current_sit}")
        
        # Extract data
        stays_data = next((d for d in details if "stays" in d), None)
        route_data = next((d for d in details if "routes" in d), None)
        review_data = next((d for d in details if "reviews" in d), None)
        match_data = next((d for d in details if "fixtures" in d), None)
        
        plan_bullets = []
        if stays_data:
            plan_bullets.append(f"#### 🏨 Staying Places Comparison (Near {stays_data.get('stadium')})")
            plan_bullets.append("Below is a side-by-side price and quality comparison of lodging stays relative to the target match stadium:")
            plan_bullets.append("")
            plan_bullets.append("| Accommodation Name | Type | Price/Night | Rating | Distance to Stadium | Amenities |")
            plan_bullets.append("| :--- | :---: | :---: | :---: | :---: | :--- |")
            
            for s in stays_data["stays"]:
                type_badge = s["type"].upper().replace("_", " ")
                amenities_str = ", ".join(s["amenities"])
                plan_bullets.append(
                    f"| **{s['name']}** | `{type_badge}` | **${s['price_usd']}** | {s['rating']}/5 | {s['distance_miles']} miles | {amenities_str} |"
                )
            plan_bullets.append("")
                
        if route_data:
            plan_bullets.append("#### 🚇 Route Service Navigation Options")
            for r in route_data["routes"]:
                plan_bullets.append(f"- **{r['mode']}**: takes **{r['duration_minutes']} mins** (Est Cost: ${r['cost_usd']:.2f}). Route: *{r['steps']}*")
                
        if review_data:
            plan_bullets.append("#### 🍔 Review Service Recommendations")
            for rev in review_data["reviews"]:
                plan_bullets.append(f"- **{rev['establishment']}** ({rev['type']}) - Rating: **{rev['rating']}/5**: *\"{rev['review']}\"*")

        if match_data:
            plan_bullets.append("#### ⚽ Match Service Fixtures")
            for f in match_data["fixtures"]:
                plan_bullets.append(f"- **vs {f['opponent']}** ({f['competition']}): Kickoff *{f['date']}* - Played **{f['location']}**")

        sections.append("**Recommended Plan**:\n" + "\n".join(plan_bullets))
        
        sections.append(f"""**Key Constraints**:
- Destination: {profile.get('stadium')}
- Transit limits: Transit cost efficiency & timing.

**Dependencies**:
- Transit schedules matching kickoff timings.
- Room vacancy at selected lodging.

**Risks and Mitigations**:
- *Risk*: Room bookings fill up fast. *Mitigation*: Secure reservation through the Stay Service immediately.
- *Risk*: Transit congestion near stadium. *Mitigation*: Use walking corridors for the final mile.

**MCP Client Node Calls**:
```json
{json.dumps(tools, indent=2)}
```

**Final Decision**: Logistics plan registered. Stays and directions synced to user matching dashboard widgets.""")

        return "\n\n".join(sections)

agent_service = AgentService()
