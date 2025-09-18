from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

from .bodies import Body, BodyRegistry
from .forces import ConstantForce, GravityForce
from .integrators import euler_step, rk4_step
from .vector import Vector3


@dataclass
class SimulationResult:
    steps: List[Dict[str, dict]]
    total_time: float
    conserved_energy: List[float]


@dataclass
class Simulation:
    timestep: float = 0.01
    method: str = "rk4"
    gravity: Vector3 = Vector3(0.0, -9.80665, 0.0)
    bodies: BodyRegistry = field(default_factory=BodyRegistry)

    def add_body(self, body: Body) -> None:
        if not body.forces:
            body.add_force(GravityForce(direction=self.gravity))
        self.bodies.add(body)

    def add_bodies(self, bodies: Iterable[Body]) -> None:
        for body in bodies:
            self.add_body(body)

    def step(self, steps: int) -> SimulationResult:
        history: List[Dict[str, dict]] = []
        energy_history: List[float] = []

        for _ in range(steps):
            snapshot: Dict[str, dict] = {}
            total_energy = 0.0

            for body in self.bodies.all():
                if self.method == "rk4":
                    new_position, new_velocity = rk4_step(
                        self.timestep,
                        body.position,
                        body.velocity,
                        lambda pos, vel, body=body: body.net_force_for_state(pos, vel) / body.mass,
                    )
                elif self.method == "euler":
                    accel = body.net_force() / body.mass
                    new_position, new_velocity = euler_step(
                        self.timestep,
                        body.position,
                        body.velocity,
                        accel,
                    )
                else:
                    raise ValueError(f"Unknown integration method: {self.method}")

                body.position = new_position
                body.velocity = new_velocity

                kinetic = 0.5 * body.mass * (body.velocity.magnitude() ** 2)
                potential = -body.mass * self.gravity.dot(body.position)
                total_energy += kinetic + potential

                snapshot[body.identifier] = {
                    "position": body.position.to_tuple(),
                    "velocity": body.velocity.to_tuple(),
                }

            history.append(snapshot)
            energy_history.append(total_energy)

        return SimulationResult(steps=history, total_time=steps * self.timestep, conserved_energy=energy_history)


def create_body(
    identifier: str,
    mass: float,
    position: Iterable[float],
    velocity: Iterable[float],
    forces: Optional[List[dict]] = None,
) -> Body:
    body = Body(
        identifier=identifier,
        mass=mass,
        position=Vector3.from_iterable(position),
        velocity=Vector3.from_iterable(velocity),
    )

    if forces:
        for force_data in forces:
            kind = force_data.get("type", "constant")
            if kind == "constant":
                vector = Vector3.from_iterable(force_data.get("vector", [0, 0, 0]))
                body.add_force(ConstantForce(vector=vector))
            elif kind == "gravity":
                direction = Vector3.from_iterable(force_data.get("direction", [0, -9.80665, 0]))
                body.add_force(GravityForce(direction=direction))
            elif kind == "drag":
                from .forces import DragForce

                body.add_force(
                    DragForce(
                        coefficient=float(force_data.get("coefficient", 0.47)),
                        reference_area=float(force_data.get("reference_area", 1.0)),
                        fluid_density=float(force_data.get("fluid_density", 1.225)),
                    )
                )
            elif kind == "spring":
                from .forces import SpringForce

                body.add_force(
                    SpringForce(
                        anchor=Vector3.from_iterable(force_data.get("anchor", [0, 0, 0])),
                        stiffness=float(force_data.get("stiffness", 10.0)),
                        damping=float(force_data.get("damping", 0.0)),
                    )
                )
            else:
                raise ValueError(f"Unsupported force type: {kind}")

    return body
