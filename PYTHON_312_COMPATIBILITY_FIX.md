# Python 3.12+ Compatibility Fix

## Issue Description

When using Python 3.12+ with Pydantic 1.10.14, the FastAPI backend may fail to start with the following error:

```
TypeError: ForwardRef._evaluate() missing 1 required keyword-only argument: 'recursive_guard'
```

This error occurs during FastAPI initialization when Pydantic tries to resolve forward references in model definitions.

## Root Cause

The issue is caused by changes in Python's `typing` module starting from Python 3.11+, where the `ForwardRef._evaluate()` method signature changed to require a `recursive_guard` parameter. Pydantic 1.10.14 was designed for older Python versions and doesn't handle this change properly.

## Solutions

### Solution 1: Upgrade to Pydantic v2 (Recommended)

1. Update `requirements.txt`:
   ```
   fastapi==0.110.0
   uvicorn==0.27.1
   pydantic==2.5.3
   ```

2. Update the code to use Pydantic v2 syntax:
   - Replace `@validator` with `@field_validator`
   - Add `@classmethod` decorator to validators
   - Replace `.dict()` with `.model_dump()`
   - Update field constraints (e.g., `min_items` → `min_length`)

3. Files requiring updates:
   - `backend/app/api/v1/endpoints/projectile.py`
   - `backend/app/api/v1/endpoints/simulation.py`

   Example files with Pydantic v2 syntax are provided as:
   - `backend/app/api/v1/endpoints/projectile_v2.py`
   - `backend/app/api/v1/endpoints/simulation_v2.py`

### Solution 2: Use Compatible Python Version

If upgrading Pydantic is not desired, use Python 3.10 or earlier:

```bash
pyenv install 3.10.12
pyenv local 3.10.12
```

### Solution 3: Pin typing_extensions (Alternative)

Sometimes pinning a compatible version of typing_extensions can help:

```bash
pip install "typing_extensions<4.6.0"
```

## Testing the Fix

After applying any solution:

1. Start the backend:
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. Test the health endpoint:
   ```bash
   curl http://127.0.0.1:8000/api/v1/health
   ```

3. Run the test suite:
   ```bash
   python -m pytest tests/ -v
   ```

## Migration Script

If upgrading to Pydantic v2, run this script to migrate the code:

```bash
#!/bin/bash
# migrate_to_pydantic_v2.sh

# Backup original files
cp backend/app/api/v1/endpoints/projectile.py backend/app/api/v1/endpoints/projectile.py.bak
cp backend/app/api/v1/endpoints/simulation.py backend/app/api/v1/endpoints/simulation.py.bak

# Replace with v2 versions
cp backend/app/api/v1/endpoints/projectile_v2.py backend/app/api/v1/endpoints/projectile.py
cp backend/app/api/v1/endpoints/simulation_v2.py backend/app/api/v1/endpoints/simulation.py

# Update requirements
cp backend/requirements-pydantic-v2.txt backend/requirements.txt

echo "Migration to Pydantic v2 complete!"
echo "Please reinstall dependencies: pip install -r requirements.txt"
```