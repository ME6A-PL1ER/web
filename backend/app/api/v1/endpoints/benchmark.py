from __future__ import annotations

import time
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from physics.simulations import Simulation, create_body
from physics.vector import Vector3

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


class BenchmarkRequest(BaseModel):
    body_counts: List[int] = Field(default=[1, 2, 5, 10, 20], description="Number of bodies to test")
    step_counts: List[int] = Field(default=[50, 100, 200, 500], description="Number of steps to test")
    timestep: float = Field(default=0.02, gt=0, description="Timestep for simulation")
    method: str = Field(default="rk4", description="Integration method (rk4 or euler)")
    iterations: int = Field(default=3, ge=1, le=10, description="Number of iterations to average")


class BenchmarkResult(BaseModel):
    body_count: int
    step_count: int
    execution_time: float
    time_per_step: float
    time_per_body_step: float


class BenchmarkResponse(BaseModel):
    results: List[BenchmarkResult]
    test_parameters: BenchmarkRequest
    system_info: dict


def create_test_bodies(count: int) -> List[dict]:
    """Create test bodies for benchmarking."""
    bodies = []
    for i in range(count):
        # Create varied initial conditions for realistic testing
        bodies.append({
            "identifier": f"body_{i}",
            "mass": 1.0 + (i * 0.1),  # Varied masses
            "position": [i * 2.0, 0.0, 0.0],  # Spread out positions
            "velocity": [5.0 + (i * 0.5), 10.0 - (i * 0.2), 0.0],  # Varied velocities
            "forces": [
                {"type": "gravity"},
                {"type": "drag", "coefficient": 0.1 + (i * 0.01)}
            ] if i % 2 == 0 else [{"type": "gravity"}]  # Some bodies with drag
        })
    return bodies


@router.post("/run", response_model=BenchmarkResponse)
def run_benchmark(request: BenchmarkRequest) -> BenchmarkResponse:
    """Run performance benchmarks for different body counts and step counts."""
    results = []
    
    for body_count in request.body_counts:
        for step_count in request.step_counts:
            execution_times = []
            
            # Run multiple iterations to get average performance
            for _ in range(request.iterations):
                # Create simulation
                simulation = Simulation(timestep=request.timestep, method=request.method)
                simulation.gravity = Vector3(0, -9.80665, 0)
                
                # Add test bodies
                test_bodies = create_test_bodies(body_count)
                for body_data in test_bodies:
                    body = create_body(
                        identifier=body_data["identifier"],
                        mass=body_data["mass"],
                        position=body_data["position"],
                        velocity=body_data["velocity"],
                        forces=body_data["forces"]
                    )
                    simulation.add_body(body)
                
                # Measure execution time
                start_time = time.perf_counter()
                simulation.step(step_count)
                end_time = time.perf_counter()
                
                execution_times.append(end_time - start_time)
            
            # Calculate averages
            avg_execution_time = sum(execution_times) / len(execution_times)
            time_per_step = avg_execution_time / step_count
            time_per_body_step = time_per_step / body_count if body_count > 0 else 0
            
            results.append(BenchmarkResult(
                body_count=body_count,
                step_count=step_count,
                execution_time=avg_execution_time,
                time_per_step=time_per_step,
                time_per_body_step=time_per_body_step
            ))
    
    return BenchmarkResponse(
        results=results,
        test_parameters=request,
        system_info={
            "integration_method": request.method,
            "timestep": request.timestep,
            "iterations_per_test": request.iterations
        }
    )


@router.get("/system-limits")
def get_system_limits() -> dict:
    """Get recommended system limits for the physics engine."""
    return {
        "recommended_max_bodies": 50,
        "recommended_max_steps": 1000,
        "performance_notes": [
            "RK4 integration is more accurate but ~4x slower than Euler",
            "Performance scales linearly with body count and step count",
            "Drag forces add computational overhead",
            "Consider reducing timestep for better accuracy vs. speed"
        ],
        "scaling_factors": {
            "bodies": "O(n) - linear scaling with number of bodies",
            "steps": "O(n) - linear scaling with number of steps",
            "forces": "O(n*f) - scales with bodies and forces per body"
        }
    }