from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol

from .vector import Vector3, ZERO_VECTOR


class Force(Protocol):
    """Protocol for forces that can be applied to bodies."""

    def compute(self, body: "Body") -> Vector3:
        ...


@dataclass
class ConstantForce:
    vector: Vector3

    def compute(self, body: "Body") -> Vector3:  # noqa: D401 - simple implementation
        return self.vector


@dataclass
class GravityForce:
    direction: Vector3 = Vector3(0.0, -9.80665, 0.0)

    def compute(self, body: "Body") -> Vector3:
        return self.direction * body.mass


@dataclass
class DragForce:
    coefficient: float
    reference_area: float = 1.0
    fluid_density: float = 1.225

    def compute(self, body: "Body") -> Vector3:
        velocity = body.velocity
        speed = velocity.magnitude()
        if speed == 0:
            return ZERO_VECTOR
        drag_magnitude = 0.5 * self.fluid_density * speed ** 2 * self.coefficient * self.reference_area
        return velocity.normalize() * (-drag_magnitude)


@dataclass
class SpringForce:
    anchor: Vector3
    stiffness: float
    damping: float = 0.0

    def compute(self, body: "Body") -> Vector3:
        displacement = body.position - self.anchor
        restoring = displacement * (-self.stiffness)
        damping_force = body.velocity * (-self.damping)
        return restoring + damping_force


@dataclass
class FrictionForce:
    """Static and kinetic friction force."""
    coefficient_static: float = 0.8
    coefficient_kinetic: float = 0.6
    normal_force_magnitude: float = 9.81  # Assumes gravity on horizontal surface
    
    def compute(self, body: "Body") -> Vector3:
        velocity = body.velocity
        speed = velocity.magnitude()
        
        if speed == 0:
            return ZERO_VECTOR
            
        # Kinetic friction opposes motion
        friction_magnitude = self.coefficient_kinetic * self.normal_force_magnitude * body.mass
        return velocity.normalize() * (-friction_magnitude)


@dataclass
class CustomForce:
    func: Callable[["Body"], Vector3]

    def compute(self, body: "Body") -> Vector3:
        return self.func(body)


__all__ = [
    "Force",
    "ConstantForce",
    "GravityForce",
    "DragForce",
    "SpringForce",
    "FrictionForce",
    "CustomForce",
]
