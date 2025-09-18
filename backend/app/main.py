from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.endpoints import health, oscillator, projectile, simulation


def create_app() -> FastAPI:
    app = FastAPI(title="Physics Engine API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api_prefix = "/api/v1"
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(projectile.router, prefix=api_prefix)
    app.include_router(oscillator.router, prefix=api_prefix)
    app.include_router(simulation.router, prefix=api_prefix)

    return app


app = create_app()
