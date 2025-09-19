# Physics Engine Playground

Physics Engine Playground is a full-stack physics sandbox featuring a pure Python simulation core served via FastAPI and an interactive React interface. The project uses standard-library numerics instead of compiled extensions for Alpine Linux compatibility.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Requirements
- Python 3.11+ (Python 3.12+ verified working)
- Node.js 18+ (Node.js 20+ verified working)

### Bootstrap and Setup Commands
Run these exact commands in order to set up the development environment:

#### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # Takes ~30 seconds, may fail due to network timeouts
pip install pytest  # Required for testing, not in requirements.txt
```

**NOTE:** `pip install` may occasionally fail with network timeouts. If this happens, retry the command. The dependencies are: fastapi==0.110.0, uvicorn==0.27.1, pydantic==1.10.14.

**CRITICAL IMPORT FIX:** The backend has an import structure issue that requires this fix:
```bash
cd backend/app
ln -sf ../physics physics
```
This creates a symlink to make the physics module accessible to the FastAPI app imports.

#### Frontend Setup  
```bash
cd frontend
npm install  # Takes ~10-15 seconds
```

### Build Commands
#### Frontend Build
```bash
cd frontend
npm run build  # Takes ~1 second, NEVER CANCEL, but very fast
```

#### Test Commands
```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v  # Takes <1 second, 3 tests
```

### Run the Application
Always run both servers for full functionality:

#### Backend Server
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload  # Starts on http://127.0.0.1:8000
```

#### Frontend Development Server
```bash
cd frontend  
npm run dev  # Starts on http://localhost:5173
```

## Validation

### Manual Testing Scenarios
After making ANY changes, ALWAYS run through these complete end-to-end scenarios:

1. **Projectile Motion Test:**
   - Open http://localhost:5173 in browser
   - Use default values (Initial speed: 20, Launch angle: 45)
   - Click "Simulate" button
   - Verify results show: Time of flight ~2.88s, Max height ~10.07m, Range ~40.79m
   - Verify trajectory chart appears

2. **Damped Oscillator Test:**
   - Click "Solve" button in oscillator section
   - Verify angular frequency and period values update
   - Verify displacement chart appears

3. **Multi-body Simulation Test:**
   - Click "Run simulation" button in simulation section
   - Verify results show trajectory plots for each body
   - Verify energy profile chart appears

4. **API Health Check:**
   ```bash
   curl http://127.0.0.1:8000/api/v1/health
   # Should return: {"status":"ok"}
   ```

### Build Validation
- Frontend: `npm run build` completes in ~1 second
- Backend tests: `python -m pytest tests/ -v` completes in <1 second with 3 passing tests
- Both dev servers start in <10 seconds

## Common Tasks

## Common Tasks

### Repository Root Directory
```
.github/copilot-instructions.md # These instructions
README.md                       # Project overview and setup guide  
backend/                        # Python FastAPI backend
  .venv/                        # Python virtual environment (created)
  app/                          # FastAPI application
    __init__.py
    main.py                     # ASGI application factory
    api/v1/endpoints/           # FastAPI routers
      __init__.py
      health.py                 # Health check endpoint
      projectile.py             # Projectile motion solver
      oscillator.py             # Damped oscillator solver  
      simulation.py             # Multi-body simulation
    physics -> ../physics       # SYMLINK (created by setup)
  physics/                      # Pure Python physics engine
    __init__.py
    analytics.py                # Analytical solvers
    bodies.py                   # Rigid body definitions
    forces.py                   # Force implementations
    integrators.py              # Numerical integration methods
    simulations.py              # Simulation runner
    vector.py                   # Vector math utilities
  tests/                        
    test_physics.py             # 3 unit tests for physics core
  requirements.txt              # Python dependencies
frontend/                       # React + Vite frontend
  node_modules/                 # NPM dependencies (created)
  dist/                         # Build output (created by build)
  src/
    components/                 # React components
      OscillatorForm.jsx        # Damped oscillator interface
      ProjectileForm.jsx        # Projectile motion interface
      SectionCard.jsx           # UI layout component
      SimulationRunner.jsx      # Multi-body simulation interface
      TrajectoryPlot.jsx        # SVG chart component
    hooks/
      useApiBase.js             # API URL configuration hook
    App.jsx                     # Main React component
    main.jsx                    # React app entry point
    styles.css                  # Application styling
  index.html                    # HTML template
  package.json                  # NPM dependencies and scripts
  package-lock.json             # NPM lock file
  vite.config.js                # Vite dev server configuration
```

### API Endpoints
All APIs are at `http://127.0.0.1:8000/api/v1/`:
- `GET /health` - Service health check
- `POST /projectile/solve` - Analytical projectile solver
- `POST /oscillator/solve` - Damped harmonic oscillator solution  
- `POST /simulation/run` - Multi-body numerical simulation

### Environment Variables
- `VITE_API_URL` - Frontend API base URL (defaults to `http://localhost:8000/api/v1`)

### Common File Locations
- Main FastAPI app: `backend/app/main.py`
- Physics engine: `backend/physics/` (analytics.py, simulations.py, vector.py, etc.)
- React components: `frontend/src/components/`
- API endpoints: `backend/app/api/v1/endpoints/`

### Troubleshooting

#### "ModuleNotFoundError: No module named 'app.physics'"
This means the symlink fix wasn't applied. Run:
```bash
cd backend/app
ln -sf ../physics physics
```

#### "pip install" fails with network timeouts
PyPI network connectivity issues can cause timeouts. Retry the command:
```bash
pip install -r requirements.txt
```
If it continues to fail, install packages individually:
```bash
pip install fastapi==0.110.0
pip install uvicorn==0.27.1  
pip install pydantic==1.10.14
pip install pytest
```

#### Frontend can't connect to backend
Verify backend is running on port 8000:
```bash
curl http://127.0.0.1:8000/api/v1/health
```

#### Backend import errors
Ensure you're running uvicorn from the `backend/` directory with the virtual environment activated.

## Key Points for Development
- **NO BUILD TOOLCHAIN:** Project intentionally avoids complex builds - everything is fast
- **NO LINTING CONFIGURED:** No ESLint, Prettier, or Python linting configured
- **SYMLINK DEPENDENCY:** Backend requires the physics symlink to work correctly
- **ALPINE COMPATIBLE:** Pure Python dependencies, no native extensions
- **FAST ITERATION:** All commands complete in <30 seconds, ideal for quick development cycles

Always test functionality manually after making changes - automated tests only cover the physics core, not the web interface integration.