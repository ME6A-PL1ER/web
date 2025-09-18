from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, TYPE_CHECKING

from .vector import Vector3, ZERO_VECTOR

if TYPE_CHECKING:
    from .forces import Force


@dataclass
class Body:
    """Represents a rigid body in the simulation."""

    identifier: str
    mass: float
    position: Vector3
    velocity: Vector3
    radius: float = 1.0
    restitution: float = 0.5
    forces: List["Force"] = field(default_factory=list)

    def net_force(self) -> Vector3:
        total = ZERO_VECTOR
        for force in self.forces:
            total += force.compute(self)
        return total

    def add_force(self, force: "Force") -> None:
        self.forces.append(force)

    def net_force_for_state(self, position: Vector3, velocity: Vector3) -> Vector3:
        original_position = self.position
        original_velocity = self.velocity
        try:
            self.position = position
            self.velocity = velocity
            return self.net_force()
        finally:
            self.position = original_position
            self.velocity = original_velocity


class BodyRegistry:
    """Utility container for bodies keyed by identifier."""

    def __init__(self) -> None:
        self._bodies: Dict[str, Body] = {}

    def add(self, body: Body) -> None:
        if body.identifier in self._bodies:
            raise ValueError(f"Body {body.identifier!r} already registered")
        self._bodies[body.identifier] = body

    def get(self, identifier: str) -> Body:
        try:
            return self._bodies[identifier]
        except KeyError as exc:
            raise KeyError(f"Unknown body {identifier!r}") from exc

    def remove(self, identifier: str) -> None:
        self._bodies.pop(identifier, None)

    def all(self) -> List[Body]:
        return list(self._bodies.values())

    def __contains__(self, identifier: str) -> bool:
        return identifier in self._bodies

    def clear(self) -> None:
        self._bodies.clear()
