from __future__ import annotations

from math import radians
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field, validator

from ....physics.analytics import projectile_motion

router = APIRouter(prefix="/projectile", tags=["projectile"])


class ProjectileRequest(BaseModel):
    initial_speed: float = Field(..., gt=0, description="Initial speed magnitude in m/s")
    launch_angle: float = Field(..., description="Launch angle in degrees")
    initial_height: float = Field(0.0, ge=0, description="Starting height in meters")
    gravity: float = Field(9.80665, gt=0, description="Acceleration due to gravity in m/s^2")
    samples: int = Field(50, ge=2, le=5000)

    @validator("launch_angle")
    def validate_angle(cls, value: float) -> float:
        if not 0 <= value <= 180:
            raise ValueError("Launch angle must be between 0 and 180 degrees")
        return value


class VectorResponse(BaseModel):
    x: float
    y: float
    z: float


class ProjectileResponse(BaseModel):
    time_of_flight: float
    max_height: float
    range: float
    trajectory: List[VectorResponse]


@router.post("/solve", response_model=ProjectileResponse)
def solve_projectile(request: ProjectileRequest) -> ProjectileResponse:
    result = projectile_motion(
        initial_speed=request.initial_speed,
        launch_angle=radians(request.launch_angle),
        initial_height=request.initial_height,
        gravity=request.gravity,
        samples=request.samples,
    )

    return ProjectileResponse(
        time_of_flight=result.time_of_flight,
        max_height=result.max_height,
        range=result.range,
        trajectory=[VectorResponse(x=v.x, y=v.y, z=v.z) for v in result.trajectory],
    )
