# Offside AI

Offside AI is a modern agentic sports analysis application built with **Next.js 15**, **FastAPI**, **Gemini 3 Pro** (Vertex AI Agent Builder), and **MongoDB Atlas**.

---

## Directory Structure

```
Offside_AI/
+-- agents/              # Agent Builder packages and agent configuration artifacts
+   +-- globus-2026/     # Globus 2026 Goal-Oriented Agent package
+       +-- agent.yaml
+       +-- system-instruction.md
+       +-- tools/
+       +-- eval-prompts.md
+-- frontend/            # Next.js 15 Frontend
|   +-- app/             # App Router
|   +-- components/      # UI components
|   +-- hooks/           # Custom React hooks
|   +-- services/        # API integrations
|   +-- store/           # Global state management
|   +-- types/           # TS definitions
|   +-- utils/           # Helper functions
|   +-- public/          # Static assets
|   +-- package.json
|
+-- backend/             # FastAPI Backend
|   +-- app/
|   |   +-- api/         # FastAPI Route handlers
|   |   +-- agents/      # Vertex AI Agents integration
|   |   +-- services/    # Business logic
|   |   +-- models/      # MongoDB schemas / Pydantic models
|   |   +-- data/        # Local seed data for prototype tools
|   |   +-- db/          # Database client setup
|   |   +-- middleware/  # CORS, logging, error handlers
|   |   +-- utils/       # Shared utility helpers
|   |   +-- main.py      # Entry point
|   +-- tests/           # Unit and Integration tests
|   +-- requirements.txt # Python dependencies
|   +-- Dockerfile       # Container setup
|
+-- infrastructure/      # Deployment infrastructure
|   +-- docker/          # Docker Compose or Compose local overrides
|   +-- terraform/       # IAC configuration for GCP / Firebase
|   +-- cloudbuild/      # CI/CD configs
|
+-- docs/                # Comprehensive Documentation
|   +-- architecture.md  # Deep dive system design
|   +-- api.md           # API specs
|   +-- demo-plan.md     # Phase goals
|   +-- agent-builder/   # Agent Builder planning docs
```

---

## Quick Start (Local Run)

### Prerequisites
- Node.js `v18.17+` (v18.20.4 is active on current system environment)
- Python `3.12`

### Running the Frontend
1. Change directory to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
4. Access app at [http://localhost:3000](http://localhost:3000)

### Running the Backend
1. Change directory to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
   ```
5. Access APIs at [http://localhost:8080](http://localhost:8080) and interactive Swagger docs at [http://localhost:8080/docs](http://localhost:8080/docs)

### Globus 2026 Agent Builder Package

Agent Builder artifacts live in `agents/globus-2026/`.

Use these files to create the Goal-Oriented agent:
- `agents/globus-2026/agent.yaml`
- `agents/globus-2026/system-instruction.md`
- `agents/globus-2026/tools/openapi.yaml`
- `agents/globus-2026/tools/tool-manifest.yaml`

The local FastAPI tool bridge exposes logistics endpoints under:

`http://localhost:8080/api/v1/logistics`
