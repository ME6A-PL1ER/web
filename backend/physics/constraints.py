"""
Constraint and joint system for multi-body physics simulations.
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, TYPE_CHECKING

from .vector import Vector3

if TYPE_CHECKING:
    from .bodies import Body, BodyRegistry


class Constraint(ABC):
    """Base class for constraints between bodies."""
    
    @abstractmethod
    def apply(self, bodies: "BodyRegistry", dt: float) -> None:
        """Apply the constraint to the bodies."""
        pass


@dataclass
class DistanceConstraint(Constraint):
    """Maintains a fixed distance between two bodies (like a rigid rod)."""
    
    body1_id: str
    body2_id: str
    target_distance: float
    stiffness: float = 1.0  # How rigidly the constraint is enforced (0-1)
    
    def apply(self, bodies: "BodyRegistry", dt: float) -> None:
        """Apply distance constraint between two bodies."""
        try:
            body1 = bodies.get(self.body1_id)
            body2 = bodies.get(self.body2_id)
        except KeyError:
            return  # One or both bodies don't exist
        
        # Calculate current distance and displacement
        displacement = body2.position - body1.position
        current_distance = displacement.magnitude()
        
        if current_distance < 1e-10:
            return  # Bodies at same position, can't apply constraint
        
        # Calculate constraint violation
        violation = current_distance - self.target_distance
        if abs(violation) < 1e-6:
            return  # Already satisfied
        
        # Calculate constraint force direction
        direction = displacement / current_distance
        
        # Calculate relative mass factor
        mass_factor = 1 / (body1.mass + body2.mass)
        
        # Apply position correction proportional to masses
        correction = violation * self.stiffness * 0.5
        correction_vector = direction * correction
        
        body1.position += correction_vector * (body2.mass * mass_factor)
        body2.position -= correction_vector * (body1.mass * mass_factor)


@dataclass 
class SpringConstraint(Constraint):
    """A spring constraint between two bodies."""
    
    body1_id: str
    body2_id: str
    rest_length: float
    spring_constant: float  # Stiffness of the spring
    damping: float = 0.0   # Damping coefficient
    
    def apply(self, bodies: "BodyRegistry", dt: float) -> None:
        """Apply spring force between two bodies."""
        try:
            body1 = bodies.get(self.body1_id)
            body2 = bodies.get(self.body2_id)
        except KeyError:
            return  # One or both bodies don't exist
        
        # Calculate displacement and distance
        displacement = body2.position - body1.position
        current_distance = displacement.magnitude()
        
        if current_distance < 1e-10:
            return  # Bodies at same position
        
        # Spring force: F = -k * (current_length - rest_length)
        spring_force_magnitude = -self.spring_constant * (current_distance - self.rest_length)
        direction = displacement / current_distance
        spring_force = direction * spring_force_magnitude
        
        # Add damping based on relative velocity
        if self.damping > 0:
            relative_velocity = body2.velocity - body1.velocity
            damping_force = direction * (relative_velocity.dot(direction) * self.damping)
            spring_force -= damping_force
        
        # Apply forces (Newton's third law)
        # Force is applied as an impulse over the timestep
        impulse = spring_force * dt
        body1.velocity -= impulse / body1.mass
        body2.velocity += impulse / body2.mass


@dataclass
class PinConstraint(Constraint):
    """Pins a body to a fixed position in space."""
    
    body_id: str
    anchor_position: Vector3
    stiffness: float = 1.0
    
    def apply(self, bodies: "BodyRegistry", dt: float) -> None:
        """Pin body to anchor position."""
        try:
            body = bodies.get(self.body_id)
        except KeyError:
            return  # Body doesn't exist
        
        # Calculate displacement from anchor
        displacement = body.position - self.anchor_position
        
        # Apply position correction
        correction = displacement * self.stiffness
        body.position -= correction
        
        # Also damp velocity towards the anchor
        body.velocity *= (1.0 - self.stiffness * dt)


@dataclass
class RevoluteJoint(Constraint):
    """A revolute (pin) joint that allows rotation around a fixed point."""
    
    body1_id: str
    body2_id: str
    anchor_point: Vector3  # World space anchor point
    
    def apply(self, bodies: "BodyRegistry", dt: float) -> None:
        """Apply revolute joint constraint."""
        try:
            body1 = bodies.get(self.body1_id)
            body2 = bodies.get(self.body2_id)
        except KeyError:
            return  # One or both bodies don't exist
        
        # Calculate center of mass
        total_mass = body1.mass + body2.mass
        com = (body1.position * body1.mass + body2.position * body2.mass) / total_mass
        
        # Move center of mass to anchor point
        correction = self.anchor_point - com
        
        # Apply position corrections proportional to masses
        mass_factor = 1 / total_mass
        body1.position += correction * (body1.mass * mass_factor)
        body2.position += correction * (body2.mass * mass_factor)


class ConstraintSolver:
    """Solver for applying constraints to bodies."""
    
    def __init__(self):
        self.constraints: List[Constraint] = []
    
    def add_constraint(self, constraint: Constraint) -> None:
        """Add a constraint to the solver."""
        self.constraints.append(constraint)
    
    def remove_constraint(self, constraint: Constraint) -> None:
        """Remove a constraint from the solver."""
        if constraint in self.constraints:
            self.constraints.remove(constraint)
    
    def clear_constraints(self) -> None:
        """Remove all constraints."""
        self.constraints.clear()
    
    def solve(self, bodies: "BodyRegistry", dt: float, iterations: int = 1) -> None:
        """
        Solve all constraints for the given timestep.
        
        Args:
            bodies: Registry of bodies to apply constraints to
            dt: Time step
            iterations: Number of solver iterations (more = more accurate)
        """
        for _ in range(iterations):
            for constraint in self.constraints:
                constraint.apply(bodies, dt)


# Factory functions for creating common constraint setups
def create_rope(body1_id: str, body2_id: str, length: float, segments: int = 1) -> List[Constraint]:
    """
    Create a rope-like connection between two bodies using distance constraints.
    
    Args:
        body1_id: First body identifier
        body2_id: Second body identifier  
        length: Total length of the rope
        segments: Number of segments (more = more flexible)
        
    Returns:
        List of constraints representing the rope
    """
    if segments == 1:
        return [DistanceConstraint(body1_id, body2_id, length, stiffness=0.8)]
    
    # For multi-segment ropes, would need intermediate bodies
    # For now, just return a single constraint
    return [DistanceConstraint(body1_id, body2_id, length, stiffness=0.8)]


def create_spring_chain(body1_id: str, body2_id: str, rest_length: float, 
                       spring_constant: float, damping: float = 0.1) -> List[Constraint]:
    """Create a spring connection between two bodies."""
    return [SpringConstraint(body1_id, body2_id, rest_length, spring_constant, damping)]


__all__ = [
    "Constraint",
    "DistanceConstraint", 
    "SpringConstraint",
    "PinConstraint",
    "RevoluteJoint",
    "ConstraintSolver",
    "create_rope",
    "create_spring_chain"
]