# Physics Engine Playground

A full-stack physics sandbox featuring a pure Python simulation core served via FastAPI and an interactive React interface. The
project is engineered for portability (including Alpine Linux) by relying on standard-library numerics instead of compiled
extensions.

## Features

- **FastAPI backend** with analytical solvers (projectile motion, damped oscillators) and a configurable multi-body simulation
  engine that supports Runge–Kutta 4 or Euler integration.
- **Pure Python physics core** implementing vectors, forces (gravity, drag, springs, constant thrust) and an energy monitor so it
  can run without native extensions.
- **React + Vite frontend** providing rich forms, live charts rendered with SVG, and tabular inspection of multi-step simulation
  output.
- **Configurable API base URL** via the `VITE_API_URL` environment variable to point the UI at remote FastAPI deployments.

## Getting started

### Requirements

- Python 3.11+
- Node.js 18+

### Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000` by default. Documentation is auto-generated at `http://127.0.0.1:8000/docs`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on port `5173`. During development it proxies API calls directly to the backend URL defined in
`VITE_API_URL` (defaults to `http://localhost:8000/api/v1`).

## API overview

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/health` | Service health check. |
| `POST /api/v1/projectile/solve` | Analytical projectile solver returning trajectory samples, range, and maximum height. |
| `POST /api/v1/oscillator/solve` | Damped harmonic oscillator solution sampled over time. |
| `POST /api/v1/simulation/run` | Numerical simulation for any number of rigid bodies with drag, thrust, and gravity. |

Example payload for the simulation runner:

```json
{
  "timestep": 0.02,
  "method": "rk4",
  "gravity": [0, -9.80665, 0],
  "steps": 200,
  "bodies": [
    {
      "identifier": "projectile",
      "mass": 1,
      "position": [0, 0, 0],
      "velocity": [8, 14, 0],
      "forces": [
        { "type": "drag", "coefficient": 0.2 },
        { "type": "constant", "vector": [0, 0, 0] }
      ]
    }
  ]
}
```

## Alpine Linux compatibility

The backend uses only pure-Python dependencies (FastAPI, Pydantic, Uvicorn) and the physics engine avoids NumPy or SciPy. This
makes it straightforward to deploy on Alpine-based images or minimal environments without a full build toolchain.

## Project structure

```
backend/
  app/
    api/v1/endpoints/    # FastAPI routers
    main.py              # ASGI application factory
  physics/               # Vector math, forces, analytics, simulation core
  requirements.txt
frontend/
  src/
    components/          # React UI building blocks
    hooks/               # Shared frontend utilities
    App.jsx, main.jsx
  index.html
  package.json
README.md
```

## Testing

Run unit tests (if added) with `pytest` inside the backend virtual environment. The frontend uses Vite’s development server and
can be verified with `npm run build`.
