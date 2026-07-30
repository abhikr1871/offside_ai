# Offside AI Interview Documentation

Prepared for: Project interview and technical walkthrough

Project root: `C:\Users\abhij\OneDrive\Desktop\Offside_AI`

Generated on: 2026-07-22

## 1. Executive Summary

Offside AI is a full-stack football intelligence and matchday logistics platform. It combines a Next.js frontend, a FastAPI backend, MongoDB Atlas data storage and caching, external sports/travel/weather APIs, and Gemini-powered agent workflows.

The project is not only a live-score dashboard. It is designed as a fan and operations assistant where a user can:

- Sign up and save a football profile.
- Select followed teams and favorite players.
- See live or recently completed matches.
- Ask schedule questions using retrieval augmented generation.
- View league standings and team/player details.
- Book match tickets and inspect ticket availability.
- Run AI-based ticket demand and tactical analysis.
- Plan a matchday journey with stays, routes, nearby places, safety checks, and a total cost estimate.
- Interact with an agent named Globus 2026 for World Cup logistics.
- Use a fan marketplace for merchandise or ticket-related listings.

The most important thing to explain in an interview is this:

Offside AI is an agentic sports platform. The frontend gives fans an interactive control center, while the backend normalizes data from football APIs, MongoDB, Gemini, and custom MCP-style travel tools into one product experience.

## 2. One-Minute Interview Pitch

Offside AI is a Next.js and FastAPI application for football fans and matchday logistics. A user creates a profile, follows teams, views live match feeds, checks standings, books or analyzes tickets, and asks an AI assistant to plan the matchday journey. The backend integrates football-data.org, MongoDB Atlas caching, Gemini/Vertex AI, Ticketmaster, Open-Meteo/OpenWeather, Google Maps/Places, and custom MCP tools for lodging and directions. The most advanced part is the Globus 2026 agent flow, which routes natural-language requests into tool calls, retrieves context, validates budget and safety constraints, and returns an itinerary with selected stays, routes, warnings, and rationale.

## 3. High-Level Architecture

The architecture has four major layers:

- Frontend layer: Next.js 15 App Router with React 19 and TypeScript.
- Backend API layer: FastAPI with routers grouped by domain.
- Data and integration layer: MongoDB Atlas, football-data.org, Ticketmaster, weather APIs, Google Maps/Places, lodging providers, and local seed data.
- AI and agent layer: Gemini through Google AI Studio or Vertex AI, MongoDB vector search, and a local MCP-style tool server.

ASCII architecture:

```text
User Browser
  |
  | Next.js pages and components
  v
Frontend App
  |
  | HTTP requests to NEXT_PUBLIC_API_URL or localhost:8080
  v
FastAPI Backend
  |
  +-- Auth/Profile/Tickets/Store -> MongoDB Atlas
  +-- Live Scores/Teams/Standings -> football-data.org + MongoDB cache
  +-- Schedule RAG -> Gemini embeddings + MongoDB vector search + Gemini answer
  +-- Tactical/Ticket AI -> Gemini with deterministic fallback
  +-- Agent Chat/Journey Plan -> Gemini router + MCP tool server
  +-- Weather/Ticketing -> Open-Meteo/OpenWeather/Ticketmaster
  |
  v
Normalized JSON responses used by dashboard UI
```

## 4. Repository Structure

Top-level layout:

```text
Offside_AI/
  agents/
    globus-2026/
      agent.yaml
      system-instruction.md
      eval-prompts.md
      tools/
        openapi.yaml
        tool-manifest.yaml
  backend/
    app/
      api/
      services/
      schemas/
      db/
      mcp/
      agents/
      data/
      utils/
      main.py
    requirements.txt
    Dockerfile
    run.py
  frontend/
    app/
    components/
    lib/
    public/
    scripts/
    package.json
  docs/
    architecture.md
    api.md
    demo-plan.md
  infrastructure/
  scratch/
```

Important files:

- `backend/app/main.py`: FastAPI app creation, CORS, router registration, health/config endpoints.
- `backend/run.py`: Windows-safe Uvicorn launcher.
- `backend/app/db/vector_search.py`: MongoDB connection and Atlas Vector Search.
- `backend/app/api/*.py`: API route handlers.
- `backend/app/services/*.py`: business logic and external integration logic.
- `backend/app/mcp/stay_mcp_client.py`: JSON-RPC client that starts the local MCP service process.
- `backend/app/mcp/services_server.py`: local MCP-style tool server for stays, directions, and nearby recommendations.
- `frontend/app/page.tsx`: public home dashboard.
- `frontend/app/dashboard/page.tsx`: authenticated multi-tab fan dashboard.
- `frontend/app/onboarding/page.tsx`: profile setup flow.
- `frontend/lib/auth.ts`: local browser auth helpers plus backend auth calls.
- `agents/globus-2026/agent.yaml`: Vertex Agent Builder agent configuration.
- `agents/globus-2026/system-instruction.md`: operating rules for the Globus 2026 agent.

## 5. Technology Stack

Frontend:

- Next.js 15.5.18
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- ESLint 9
- Static media assets in `frontend/public`

Backend:

- Python 3.12 style project
- FastAPI 0.111
- Uvicorn 0.30
- Pydantic 2
- Motor and PyMongo for MongoDB Atlas
- httpx for async external API calls
- python-dotenv for local environment loading

AI and data:

- Google Generative AI SDK through `google-generativeai`
- Vertex AI SDK through `google-cloud-aiplatform`
- Gemini model selected by `GEMINI_MODEL_NAME`, defaulting to `gemini-1.5-flash` in code
- Text embeddings through `text-embedding-004`
- MongoDB Atlas Vector Search
- football-data.org for football data
- Ticketmaster Discovery API for ticket availability
- OpenWeather or Open-Meteo for weather
- Google Maps Directions and Places APIs for routing and recommendations
- Hotelbeds, LiteAPI, and Airbnb scraping for stays

## 6. Backend Startup Flow

The backend starts from either:

```bash
cd backend
python run.py
```

or:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

`backend/run.py` exists because Windows has a known asyncio subprocess issue. The MCP client starts a local subprocess, and subprocess support needs the right event loop. The custom launcher sets `WindowsProactorEventLoopPolicy()` before Uvicorn creates the event loop.

`backend/app/main.py` then:

- Loads environment variables from `backend/.env`.
- Creates the FastAPI app.
- Adds CORS middleware.
- Registers all routers.
- Exposes `/`, `/health`, and `/api/v1/config`.

The config endpoint switches supported leagues depending on `APP_MODE`:

- `APP_MODE=club`: Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Champions League, Championship, Eredivisie, Primeira Liga, Copa Libertadores.
- Any non-club/worldcup mode: FIFA World Cup only.

## 7. Frontend Startup Flow

The frontend runs from:

```bash
cd frontend
npm install
npm run dev
```

The default backend base URL is usually:

```text
http://localhost:8080
```

Most frontend files use:

```ts
process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
```

However, `frontend/lib/auth.ts` hardcodes `BACKEND_URL = "http://localhost:8080"`, which is a deployment improvement item.

## 8. Main User Journey

1. Landing page

The user enters through `frontend/app/page.tsx`. This page loads `/api/v1/config`, detects app mode, and renders:

- Header
- LiveScore
- FollowTeam
- LeagueStandings
- JourneyHub
- ScheduleRAG

2. Signup and login

`frontend/components/AuthForm.tsx` calls:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`

The backend stores the user in MongoDB. The frontend also stores a lightweight user object in localStorage so the UI can quickly detect a logged-in user.

3. Onboarding

`frontend/app/onboarding/page.tsx` collects:

- Followed teams
- Favorite players
- Country
- City
- Preferred/favorite stadium
- Street/home description

It saves the profile through:

```text
PUT /api/v1/auth/profile
```

4. Dashboard

`frontend/app/dashboard/page.tsx` is the main authenticated app. It has tabs for:

- Dashboard
- Plan your Journey
- Book your Ticket
- Matchday Assistant
- Match Analysis
- Fans Store
- Contact Us
- Settings

## 9. Backend API Map

Core endpoints:

- `GET /`: backend status.
- `GET /health`: health response.
- `GET /api/v1/config`: app mode and supported leagues.

Auth:

- `POST /api/v1/auth/signup`: creates a MongoDB user.
- `POST /api/v1/auth/login`: validates email/password.
- `PUT /api/v1/auth/profile`: saves onboarding/profile fields.
- `GET /api/v1/auth/profile?email=...`: loads profile and onboarding flag.

Live matches:

- `GET /api/v1/live-matches/feed?league=PL`
- `GET /api/v1/live-matches/teams?league=PL`
- `GET /api/v1/live-matches/match/{match_id}`
- `GET /api/v1/live-matches/followed-upcoming?email=...`

Competitions and teams:

- `GET /api/v1/competitions/`
- `GET /api/v1/competitions/{code}/teams`
- `GET /api/v1/competitions/{code}/standings`
- `GET /api/v1/teams/directory/all`
- `GET /api/v1/teams/by-name/{team_name}`
- `GET /api/v1/teams/{team_id}`

Schedule RAG:

- `GET /api/v1/schedule/feed`
- `POST /api/v1/schedule/ask`

Logistics:

- `GET /api/v1/logistics/fans/{fan_id}`
- `GET /api/v1/logistics/transport/options?fan_id=...&venue_id=...`
- `POST /api/v1/logistics/inventory/update`
- `POST /api/v1/logistics/incidents/escalate`
- `POST /api/v1/logistics/action-log`
- `GET /api/v1/logistics/state`
- `GET /api/v1/logistics/stays`
- `GET /api/v1/logistics/directions`

Agent:

- `POST /api/v1/agent/chat`
- `POST /api/v1/agent/plan`

Tickets:

- `POST /api/v1/tickets/book`
- `GET /api/v1/tickets?email=...`
- `DELETE /api/v1/tickets/{booking_id}?email=...`
- `GET /api/v1/tickets/availability?match_name=...`
- `POST /api/v1/tickets/predict`
- `GET /api/v1/tickets/custom-match`
- `GET /api/v1/tickets/stadium-intelligence`

Analysis:

- `POST /api/v1/analysis/tactical`
- `POST /api/v1/analysis/prompt-search`

Players:

- `GET /api/v1/players/search?name=...`
- `GET /api/v1/players/{player_id}`

Store:

- `POST /api/v1/store/products`
- `GET /api/v1/store/products`
- `POST /api/v1/store/buy/{product_id}`

## 10. Database Design and MongoDB Usage

MongoDB is initialized in `backend/app/db/vector_search.py`.

Environment variables:

- `MONGODB_URI`
- `MONGODB_DB_NAME`, default `offside_ai`
- `APP_MODE`, default `club`

The selected schedule collection is:

- `club_2026_schedule` when `APP_MODE=club`
- `fifa_2026_schedule` otherwise

Major collections used:

- `users`: auth and profile data.
- `ticket_bookings`: booked ticket documents.
- `store_products`: fan marketplace listings.
- `club_2026_schedule` or `fifa_2026_schedule`: schedule documents and embeddings.
- `api_football_data_matches_cache`: cached match feeds.
- `api_football_data_match_detail_cache`: cached match details.
- `api_football_data_competitions_cache`: competitions cache.
- `api_football_data_league_teams_cache`: league teams cache.
- `api_football_data_teams_cache`: team squad cache.
- `api_football_data_league_standings_cache`: standings cache.
- `api_team_matches_cache`: team match helper cache.
- `safety_sources`: optional safety RAG documents.
- `teams`: optional fallback team directory.

The vector search manager uses MongoDB Atlas `$vectorSearch` with index name `vector_index` and embedding path `embedding`.

## 11. RAG Flow

RAG appears in schedule Q&A and safety planning.

Schedule RAG flow:

1. User asks a schedule question in the frontend.
2. Frontend calls `POST /api/v1/schedule/ask`.
3. Backend uses `RAGService.answer_schedule_query()`.
4. It generates an embedding using `text-embedding-004`.
5. It searches MongoDB Atlas Vector Search.
6. It builds a verified context string from top schedule documents.
7. Gemini generates an answer constrained to that retrieved context.
8. Backend returns the answer, sources, query, and model label.

Important limitation:

If MongoDB is not connected, schedule search raises an error. Unlike some other modules, this route does not fully mock its result.

## 12. Live Match Data Flow

Live match data is handled mostly by `backend/app/services/live_match_services.py`.

Flow:

1. Frontend calls `/api/v1/live-matches/feed?league=PL`.
2. The service maps frontend league codes to football-data.org codes.
3. It tries to read a fresh MongoDB cache.
4. If cache is missing or stale, it calls football-data.org.
5. It stores the response in MongoDB.
6. It normalizes external API shape into frontend-friendly fields:
   - `id`
   - `homeTeam`
   - `awayTeam`
   - `homeScore`
   - `awayScore`
   - `status`
   - `minute`
   - `goals`
   - `bookings`
   - `crests`
   - `venue`
   - `eventDate`
7. It ranks live matches first, then recent finished matches, then scheduled matches.

Caching behavior:

- World Cup historical match cache TTL: 10 days.
- Active league cache TTL: 1 hour.
- Match detail cache TTL:
  - Finished: 10 days.
  - Scheduled: 1 hour.
  - Live/active: 30 seconds.

## 13. Competitions, Teams, and Standings

`backend/app/services/competitions_service.py` handles:

- Supported competitions.
- League team lists.
- Team squad details.
- Standings.
- Rich team directory.
- Fallback team data.

The service uses MongoDB caching aggressively because football-data.org calls can be rate-limited.

Current worktree behavior:

- Team list failures now generate fallback teams instead of failing.
- Standings failures now use expired cache or generated mock standings.
- This makes the demo more resilient but should be explained as fallback behavior, not live verified data.

## 14. Authentication and Profile Design

Auth route file: `backend/app/api/auth.py`

The backend:

- Normalizes email to lowercase.
- Hashes password with SHA-256.
- Stores users in MongoDB.
- Returns basic user fields.
- Stores profile fields during onboarding.

Frontend auth file: `frontend/lib/auth.ts`

The frontend:

- Calls backend signup/login endpoints.
- Stores users and the current user email in browser localStorage.
- Uses `offside_users` and `offside_current_user_email`.

Interview explanation:

This is prototype authentication, not production-grade authentication. A production version should use JWT/session cookies, refresh tokens, password hashing with bcrypt/argon2, HTTPS-only cookies, and rate limiting.

## 15. Ticketing Features

Ticketing is in `backend/app/api/tickets.py`.

Features:

- Book tickets into MongoDB.
- Retrieve tickets by user email.
- Cancel tickets by booking id.
- Check live ticket availability with Ticketmaster when `TICKETMASTER_API_KEY` is configured.
- Generate AI or fallback ticket demand forecasts.
- Build a custom match object from a typed query.
- Fetch stadium intelligence with weather, stands, ticket rate estimates, gate entry info, and market sentiment.

Ticket forecasting:

- If Gemini is configured, the backend asks Gemini for attendance, sellout probability, price movement, recommendation, seating occupancy, and reasoning.
- If Gemini is unavailable or rate-limited, it uses deterministic hash-based heuristics. This keeps the UI functional during demos.

Stadium intelligence:

- Weather uses OpenWeather when configured, then Open-Meteo as a no-key fallback.
- Stadium seating intelligence uses Gemini when available.
- If Gemini fails, it returns deterministic stand data and demand percentages.

## 16. Tactical Match Analysis

Tactical analysis is in `backend/app/api/analysis.py`.

Main endpoint:

```text
POST /api/v1/analysis/tactical
```

It accepts match detail JSON and returns:

- Markdown report.
- MVP player.
- Threat momentum array for charting.
- Status and reasoning.

The code handles two analysis modes:

- Completed match: post-match tactical report.
- Future match: pre-match predictive preview.

Gemini failure mode:

If Gemini is unavailable or errors, the endpoint builds a local heuristic tactical report using score, goals, cards, formations, and statistics.

Prompt search:

```text
POST /api/v1/analysis/prompt-search
```

This reconstructs a historical or described match from a free-text prompt. With Gemini, it asks for realistic lineups and statistics. Without Gemini, it returns a famous-style fallback structure.

## 17. Matchday Assistant and Globus 2026 Agent

The project includes a local agent service and an Agent Builder package.

Important files:

- `backend/app/services/agent_service.py`
- `backend/app/api/agent.py`
- `agents/globus-2026/agent.yaml`
- `agents/globus-2026/system-instruction.md`
- `agents/globus-2026/tools/openapi.yaml`
- `agents/globus-2026/tools/tool-manifest.yaml`

Globus 2026 is described as an autonomous World Cup logistics planning and operations agent.

The agent is designed to:

- Understand a logistics goal.
- Determine constraints like time, location, capacity, budget, route, safety, and accessibility.
- Retrieve data through tools.
- Compare feasible options.
- Produce a recommended plan.
- Require approval before state-changing operations.
- Escalate uncertainty instead of guessing.

Agent chat flow:

1. Frontend sends `email`, `query`, and optional `lodging` to `/api/v1/agent/chat`.
2. Agent service loads user profile.
3. Gemini tries to decide which tool calls are needed.
4. If Gemini is unavailable, keyword routing selects tools.
5. Agent opens a local MCP subprocess.
6. Agent calls tools such as `search_stays`, `get_directions`, `get_food_reviews`, or `get_team_matches`.
7. Agent synthesizes a markdown response.
8. Frontend renders the response and tool calls.

Planning flow:

The planning endpoint extracts a trip goal from the prompt, selects match/stadium/stay/route options, retrieves safety context, validates budget and feasibility, and returns a structured itinerary with:

- Match name
- Match date
- Stadium
- Selected stay
- Backup stay
- Route
- Recommendations
- Safety briefing
- Validation checks
- Planning stages
- Total fare
- Summary text

## 18. MCP-Style Tool Server

The local MCP pieces are:

- `backend/app/mcp/stay_mcp_client.py`
- `backend/app/mcp/services_server.py`

The client starts `services_server.py` as a subprocess and communicates over stdin/stdout using JSON-RPC style messages.

Available tools:

- `search_stays`
- `search_hostels`
- `get_directions`
- `get_food_reviews`
- `get_team_matches`

Provider integrations:

- Airbnb scraping using parsed page state.
- Hotelbeds API using `HBX_API_KEY` and `HBX_SECRET`.
- LiteAPI using `LITEAPI_KEY`.
- Google Directions using `GOOGLE_MAPS_API_KEY` or `GOOGLE_API_KEY`.
- Google Places using `GOOGLE_MAPS_API_KEY` or `GOOGLE_API_KEY`.
- OpenStreetMap Nominatim for stadium geocoding fallback.

This is advanced because it demonstrates tool abstraction. The agent does not need to know every provider. It calls tools with a stable schema, and the tool server handles provider details.

## 19. Logistics Prototype Service

`backend/app/services/logistics_service.py` is separate from the live MCP server. It loads local seed data from:

```text
backend/app/data/logistics_seed.json
```

It provides:

- Fan profiles.
- Venue profiles.
- Transport options.
- Inventory state.
- Incident state.
- Action logs.

Important behavior:

- Inventory updates require `approved: true`.
- Incident escalations require `approved: true`.
- Without approval, the service returns `approval_required`.
- Action logs keep recent operational decisions.

This is a human-in-the-loop design pattern. It is useful in interviews because it shows that state-changing agent actions are gated.

## 20. Frontend Components

Important frontend components:

- `Header.tsx`: top navigation, theme/background controls, config loading.
- `GlobalBackground.tsx`: animated video background and theme sync.
- `AuthForm.tsx`: login/signup UI.
- `FollowTeam.tsx`: league/team selector and team detail modal entry points.
- `LiveScore.tsx`: live match cards, match detail overlay, lineups, stats, timeline.
- `LeagueStandings.tsx`: standings table with league selector.
- `ScheduleRAG.tsx`: schedule feed and natural-language schedule questions.
- `JourneyHub.tsx`: visual teaser/guide for journey planning.
- `StadiumHeatmap.tsx`: stadium stand occupancy visualization.
- `FloatingSettings.tsx`: theme and animation controls.

`frontend/app/dashboard/page.tsx` is currently very large and owns many responsibilities:

- Profile loading.
- Tab navigation.
- Ticket booking.
- Ticket forecasting.
- Stadium intelligence.
- Match analysis.
- Journey planning.
- Assistant chat.
- Store marketplace.
- Contact/settings UI.

This works for a prototype but should be split into feature components/hooks as the project grows.

## 21. Environment Variables

Backend variables seen in the code:

- `MONGODB_URI`: MongoDB Atlas connection string.
- `MONGODB_DB_NAME`: MongoDB database name.
- `APP_MODE`: `club` or World Cup mode.
- `GEMINI_API_KEY`: Google AI Studio key.
- `GEMINI_MODEL_NAME`: Gemini model name, default `gemini-1.5-flash`.
- `GCP_PROJECT`: Vertex AI project fallback.
- `GCP_LOCATION`: Vertex AI region, default `us-central1`.
- `FOOTBALL_DATA_API_KEY`: football-data.org token.
- `TICKETMASTER_API_KEY`: Ticketmaster Discovery API key.
- `OPENWEATHER_API_KEY` or `WEATHER_API_KEY`: weather API key.
- `GOOGLE_MAPS_API_KEY` or `GOOGLE_API_KEY`: Google Directions and Places.
- `HBX_API_KEY`, `HBX_SECRET`, `HBX_ENV`: Hotelbeds.
- `LITEAPI_KEY`: LiteAPI lodging provider.

Frontend variables:

- `NEXT_PUBLIC_API_URL`: backend base URL.

## 22. Advanced Concepts Used

Agentic architecture:

- Natural-language request enters the system.
- Agent chooses tools.
- Tools return structured JSON.
- Agent validates and synthesizes a final plan.

RAG:

- Embeddings created for user queries.
- MongoDB Atlas Vector Search retrieves schedule/safety context.
- Gemini answers using retrieved context.

Caching:

- External API responses are cached in MongoDB with TTL-like checks.
- Expired cache can be used as fallback in some modules.

Graceful degradation:

- If Gemini fails, deterministic heuristic responses keep the demo running.
- If external sports APIs fail, some services fall back to cache or generated data.

Human-in-the-loop control:

- Inventory and incident operations require approval.

Typed API contracts:

- FastAPI response models use Pydantic schemas for schedule, logistics, competitions, standings, and live matches.

Cross-platform subprocess handling:

- Windows-specific event loop handling and a subprocess-based MCP client.

## 23. Known Mistakes and Bugs

These are important to mention honestly in an interview.

1. Store API route mismatch

Backend store prefix:

```text
backend/app/api/store.py:9 -> /api/v1/store
```

Dashboard calls:

```text
frontend/app/dashboard/page.tsx:5686 -> /api/store/products
frontend/app/dashboard/page.tsx:5702 -> /api/store/products
frontend/app/dashboard/page.tsx:5728 -> /api/store/products/{id}/buy
```

Impact:

The store tab will call the wrong backend URL unless a proxy or duplicate route exists. Fix by changing frontend calls to `/api/v1/store/...`.

2. Unreachable match detail enrichment code

In `backend/app/services/live_match_services.py`, `_enrich_match_detail()` returns immediately:

```text
line 393: def _enrich_match_detail(...)
line 394:     return payload
```

There is a large enrichment block below that final return. Because of the early return, roster/stat fallback enrichment is unreachable.

Impact:

Match detail may not get enriched with fallback lineups/statistics as intended.

Fix:

Remove the early return or guard it behind a condition.

3. Prototype password hashing

`backend/app/api/auth.py:23` uses raw SHA-256.

Impact:

SHA-256 is not appropriate for production password storage because it is too fast and lacks per-user salt.

Fix:

Use bcrypt or argon2, add password policy, rate limiting, and session/JWT security.

4. CORS is too open

`backend/app/main.py` defines specific `origins`, but the middleware uses:

```text
allow_origins=["*"]
allow_credentials=True
```

Impact:

This is fine for local demos but not production. Wildcard origins plus credentials is a security/config smell.

Fix:

Use environment-specific allowed origins.

5. Hardcoded auth backend URL

`frontend/lib/auth.ts:10` hardcodes:

```text
http://localhost:8080
```

Impact:

Deployment needs code changes unless this is refactored.

Fix:

Use `process.env.NEXT_PUBLIC_API_URL`.

6. Large dashboard component

`frontend/app/dashboard/page.tsx` is a very large file with many unrelated features.

Impact:

Harder to test, debug, and maintain.

Fix:

Split by feature:

- `DashboardShell`
- `TicketsTab`
- `JourneyTab`
- `AssistantTab`
- `AnalysisTab`
- `StoreTab`
- hooks such as `useTickets`, `useJourneyPlan`, `useProfile`.

7. Some comments and strings are mojibake

Several files show corrupted characters such as `â”€` and `ðŸ...`.

Impact:

It does not always break runtime, but it looks unpolished and can confuse maintainers.

Fix:

Normalize files to UTF-8 and replace corrupted glyphs.

8. Mixed fallback policy

Some endpoints strictly require external services, while others generate mock/fallback data.

Impact:

Users and interviewers may not know whether data is live, cached, or simulated.

Fix:

Add explicit `source_status` fields such as `live`, `cached`, `expired_cache`, `generated_fallback`, or `unavailable`.

## 24. Recommended Improvements

Short-term improvements:

- Fix store endpoint paths.
- Fix unreachable `_enrich_match_detail()` code.
- Replace hardcoded `BACKEND_URL` in auth helper.
- Add `.env.example`.
- Add route-level error response consistency.
- Add a visible source badge in the UI for live/cached/fallback data.
- Add tests for auth, tickets, store, live matches, and agent planning.

Security improvements:

- Use bcrypt/argon2 for passwords.
- Add JWT/session cookies.
- Add rate limiting on auth and AI endpoints.
- Restrict CORS.
- Hide stack traces and provider errors from public responses.
- Validate all user-provided URLs in store listings.

Architecture improvements:

- Split dashboard into feature components.
- Move frontend API calls into a typed API client.
- Use shared TypeScript types generated from OpenAPI.
- Add background jobs for cache refresh.
- Add Redis or DB TTL indexes for cache cleanup.
- Move long prompts into separate prompt template files.

AI improvements:

- Add deterministic evaluation prompts for agent behavior.
- Store tool-call traces for debugging.
- Add confidence and data-source labels to AI output.
- Separate live operational data from heuristic/fallback text.
- Use structured JSON schema validation for all LLM outputs.

Database improvements:

- Add indexes on `email`, `booking_id`, `product_id`, cache keys, and vector fields.
- Add migrations or seed scripts.
- Add timestamps consistently.
- Add soft-delete status for tickets/store products.

DevOps improvements:

- Add Docker Compose for frontend, backend, and local Mongo/dev dependencies.
- Add CI for lint/build/tests.
- Add deployment docs for Cloud Run/Firebase.
- Add secrets management docs.

## 25. Suggested Demo Flow

1. Start backend.

```bash
cd backend
python run.py
```

2. Start frontend.

```bash
cd frontend
npm run dev
```

3. Open frontend at:

```text
http://localhost:3000
```

4. Demonstrate home page:

- Show app mode from `/api/v1/config`.
- Show live scores.
- Show league standings.
- Show followed-team selector.
- Ask a schedule question.

5. Demonstrate auth and onboarding:

- Signup.
- Choose followed teams.
- Choose favorite players.
- Save location/stadium.

6. Demonstrate dashboard:

- Dashboard tab: followed matches and profile summary.
- Tickets tab: select match, ticket forecast, stadium intelligence.
- Journey tab: custom or AI journey plan.
- Assistant tab: ask for stays or directions.
- Analysis tab: analyze a match or reconstruct one from a prompt.
- Store tab: explain marketplace concept, and mention route mismatch as a known fix if not working.

7. Explain backend:

- FastAPI routers.
- MongoDB caching.
- AI services.
- MCP tool server.
- Agent Builder package.

## 26. Interview Questions and Strong Answers

Q1. What problem does this project solve?

It solves the fragmentation problem around matchday planning. Fans usually need one app for scores, another for tickets, another for routes, another for hotels, and another for analysis. Offside AI combines match intelligence, ticketing, travel planning, and an AI assistant into a single football control center.

Q2. Why did you choose Next.js and FastAPI?

Next.js gives a modern interactive frontend with routing, TypeScript, and component-based UI. FastAPI is lightweight, async-friendly, has automatic OpenAPI docs, and works well for calling external APIs, MongoDB, and AI services.

Q3. Where is AI used?

AI is used in schedule RAG, tactical analysis, ticket demand forecasting, stadium intelligence, and the Globus 2026 logistics assistant. The assistant uses Gemini to route requests to tools and synthesize plans.

Q4. What is RAG in your project?

RAG means retrieval augmented generation. For schedule questions, the user query is embedded, MongoDB Atlas Vector Search retrieves relevant schedule documents, and Gemini answers using only that retrieved context. This reduces hallucination compared with asking the model directly.

Q5. What is the most advanced part?

The most advanced part is the agentic journey planning. A natural-language prompt is parsed into constraints, tools are called for stays/routes/recommendations, safety context is retrieved, budget and feasibility are validated, and a structured itinerary is returned.

Q6. How do you handle external API failures?

The project uses a mix of caching, expired-cache fallback, and deterministic heuristic fallback. For example, standings can fall back to generated standings, ticket forecasting can fall back to hash-based predictions, and weather can fall back from OpenWeather to Open-Meteo.

Q7. Why use MongoDB Atlas?

MongoDB is flexible for sports API payloads because match, team, ticket, and store data do not all have the same structure. Atlas Vector Search also lets the schedule RAG use embeddings without adding a separate vector database.

Q8. How does the MCP tool server work?

The backend starts a local subprocess that behaves like a JSON-RPC tool server. The agent client sends tool calls such as `search_stays` or `get_directions`, and the server handles provider-specific APIs like Airbnb, Hotelbeds, LiteAPI, Google Directions, and Google Places.

Q9. What would you fix first?

I would fix the store route mismatch and the unreachable match detail enrichment code first because they are concrete bugs. Then I would improve auth security and split the dashboard into smaller feature modules.

Q10. Is this production ready?

It is strong as a prototype and demo system, but production would need secure auth, restricted CORS, stronger monitoring, clearer source labeling for fallback data, tests, deployment configuration, and a better separation between generated fallback data and verified live data.

Q11. How is user data stored?

User accounts, onboarding profiles, tickets, and store products are stored in MongoDB. The frontend also stores a lightweight current-user marker in localStorage for UI state.

Q12. How do you avoid hallucinations?

For schedule RAG, the prompt tells Gemini to answer only from retrieved schedule context. For agent planning, the code includes retrieved safety sources, validation checks, data warnings, and fallback labels. More production hardening would include stricter schema validation and source badges.

Q13. What are the main backend design patterns?

The backend uses route-service separation, Pydantic response schemas, async external API calls, MongoDB cache wrappers, deterministic fallbacks, and a separate tool server for agent tools.

Q14. How does live match ranking work?

The live match service normalizes matches and ranks live/halftime matches first, then recently finished matches, then scheduled upcoming matches. It limits the result so the frontend receives a compact feed.

Q15. What is human-in-the-loop in this project?

The logistics service requires explicit approval for state-changing actions like inventory updates or incident escalations. The agent can propose an action, but it should not mutate operational state without approval.

Q16. What is your biggest learning from this project?

The biggest learning is that AI features need data plumbing and reliability more than fancy prompts. The hard part is connecting APIs, caching, fallbacks, validation, source tracking, and user experience into a workflow that still behaves when one provider fails.

## 27. Risk and Limitation Summary

Technical risks:

- External API rate limits.
- Missing API keys.
- MongoDB dependency for key features.
- Large frontend component complexity.
- Inconsistent fallback behavior.
- Prototype-level auth.

Product risks:

- Users may assume fallback data is live.
- Ticket and weather estimates may be interpreted as verified.
- Stadium intelligence can be generated when live data is missing.

Mitigations:

- Add visible source labels.
- Add provider status checks.
- Add monitoring and structured logs.
- Add tests around critical flows.
- Add clear UI copy for estimates versus verified data.

## 28. How to Explain the Project Under Pressure

Use this structure:

1. "It is a football intelligence and logistics platform."
2. "Frontend is Next.js, backend is FastAPI."
3. "MongoDB stores users, schedules, tickets, store data, and API caches."
4. "football-data.org provides match, team, and standings data."
5. "Gemini powers RAG, tactical analysis, forecasts, and the agent."
6. "The Globus 2026 agent calls tools through a local MCP server."
7. "I built fallback paths so the demo does not fully break when providers fail."
8. "Known next fixes are store route mismatch, unreachable enrichment code, auth hardening, and component splitting."

## 29. Final Talking Points

Strongest parts to highlight:

- Full-stack integration with real APIs.
- MongoDB Atlas Vector Search RAG.
- Agentic planning with tool calls.
- Human-in-the-loop approval for operational changes.
- Resilient fallback behavior for demos.
- Rich user-facing dashboard across live scores, tickets, analysis, journey, and store.

Be honest about:

- It is prototype auth.
- Some data can be fallback/generated.
- Dashboard needs modularization.
- A few route/code issues need cleanup.

Best closing line:

"The project shows how I think about applied AI: not just calling an LLM, but building the surrounding product, data layer, tool layer, fallback behavior, and user workflow needed to make AI useful in a real application."
