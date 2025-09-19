from __future__ import annotations

from typing import List, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from physics.simulations import Simulation, SimulationResult, create_body
from physics.vector import Vector3

router = APIRouter(prefix="/simulation", tags=["simulation"])


class ForcePayload(BaseModel):
    type: Literal["constant", "gravity", "drag", "spring", "friction"] = "constant"
    vector: Optional[List[float]] = None
    direction: Optional[List[float]] = None
    coefficient: Optional[float] = None
    reference_area: Optional[float] = None
    fluid_density: Optional[float] = None
    anchor: Optional[List[float]] = None
    stiffness: Optional[float] = None
    damping: Optional[float] = None
    coefficient_static: Optional[float] = None
    coefficient_kinetic: Optional[float] = None
    normal_force_magnitude: Optional[float] = None


class BodyPayload(BaseModel):
    identifier: str
    mass: float = Field(..., gt=0)
    position: List[float] = Field(..., min_length=2, max_length=3)
    velocity: List[float] = Field(..., min_length=2, max_length=3)
    forces: Optional[List[ForcePayload]] = None
    radius: float = Field(default=1.0, gt=0)
    restitution: float = Field(default=0.5, ge=0, le=1)
    friction: float = Field(default=0.0, ge=0)

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, value: str) -> str:
        if not value:
            raise ValueError("Identifier cannot be empty")
        return value


class SimulationRequest(BaseModel):
    timestep: float = Field(0.01, gt=0)
    method: Literal["rk4", "euler"] = "rk4"
    gravity: List[float] = Field(default_factory=lambda: [0.0, -9.80665, 0.0])
    steps: int = Field(..., gt=0, le=10000)
    bodies: List[BodyPayload]
    enable_collisions: bool = Field(default=False)

    @field_validator("bodies")
    @classmethod
    def validate_bodies(cls, value: List[BodyPayload]) -> List[BodyPayload]:
        if not value:
            raise ValueError("At least one body must be provided")
        return value


class SimulationStep(BaseModel):
    body: str
    position: List[float]
    velocity: List[float]


class SimulationResponse(BaseModel):
    total_time: float
    steps: List[List[SimulationStep]]
    energy_profile: List[float]
    collision_count: int = 0


def _serialize_result(result: SimulationResult) -> SimulationResponse:
    steps: List[List[SimulationStep]] = []
    for snapshot in result.steps:
        steps.append(
            [
                SimulationStep(body=identifier, position=list(data["position"]), velocity=list(data["velocity"]))
                for identifier, data in sorted(snapshot.items())
            ]
        )
    return SimulationResponse(
        total_time=result.total_time, 
        steps=steps, 
        energy_profile=result.conserved_energy,
        collision_count=result.collision_count
    )


@router.post("/run", response_model=SimulationResponse)
def run_simulation(payload: SimulationRequest) -> SimulationResponse:
    simulation = Simulation(
        timestep=payload.timestep, 
        method=payload.method,
        enable_collisions=payload.enable_collisions
    )
    simulation.gravity = Vector3.from_iterable(payload.gravity)

    for body_payload in payload.bodies:
        forces = [force.model_dump(exclude_none=True) for force in body_payload.forces] if body_payload.forces else None
        body = create_body(
            identifier=body_payload.identifier,
            mass=body_payload.mass,
            position=body_payload.position,
            velocity=body_payload.velocity,
            forces=forces,
            radius=body_payload.radius,
            restitution=body_payload.restitution,
            friction=body_payload.friction,
        )
        simulation.add_body(body)

    result = simulation.step(payload.steps)
    return _serialize_result(result)
