from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ....physics.analytics import damped_oscillator

router = APIRouter(prefix="/oscillator", tags=["oscillator"])


class OscillatorRequest(BaseModel):
    mass: float = Field(..., gt=0)
    stiffness: float = Field(..., gt=0)
    damping: float = Field(0.0, ge=0)
    initial_displacement: float = Field(...)
    initial_velocity: float = Field(0.0)
    duration: float = Field(10.0, gt=0)
    samples: int = Field(200, ge=2, le=5000)


class OscillatorPoint(BaseModel):
    time: float
    displacement: float


class OscillatorResponse(BaseModel):
    angular_frequency: float
    period: float
    trajectory: list[OscillatorPoint]


@router.post("/solve", response_model=OscillatorResponse)
def solve_oscillator(request: OscillatorRequest) -> OscillatorResponse:
    result = damped_oscillator(
        mass=request.mass,
        stiffness=request.stiffness,
        damping=request.damping,
        initial_displacement=request.initial_displacement,
        initial_velocity=request.initial_velocity,
        duration=request.duration,
        samples=request.samples,
    )

    return OscillatorResponse(
        angular_frequency=result.angular_frequency,
        period=result.period,
        trajectory=[
            OscillatorPoint(time=point.x, displacement=point.y)
            for point in result.trajectory
        ],
    )
