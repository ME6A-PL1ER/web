from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

from .vector import Vector3, ZERO_VECTOR


@dataclass
class Collision:
    """Represents a collision between two bodies."""
    body1_id: str
    body2_id: str
    contact_point: Vector3
    contact_normal: Vector3  # Points from body1 to body2
    penetration_depth: float
    relative_velocity: Vector3


class CollisionDetector:
    """Handles collision detection between bodies."""
    
    @staticmethod
    def detect_sphere_collision(body1: "Body", body2: "Body") -> Optional[Collision]:
        """Detect collision between two spherical bodies."""
        from .bodies import Body  # Avoid circular import
        
        # Calculate distance between centers
        displacement = body2.position - body1.position
        distance = displacement.magnitude()
        
        # Check if collision occurs (distance less than sum of radii)
        combined_radius = body1.radius + body2.radius
        if distance >= combined_radius:
            return None  # No collision
        
        # Calculate collision details
        penetration_depth = combined_radius - distance
        
        if distance > 0:
            contact_normal = displacement.normalize()
        else:
            # Bodies are at same position, use arbitrary normal
            contact_normal = Vector3(1, 0, 0)
        
        # Contact point is on the line between centers
        contact_point = body1.position + contact_normal * body1.radius
        
        # Relative velocity at contact point
        relative_velocity = body2.velocity - body1.velocity
        
        return Collision(
            body1_id=body1.identifier,
            body2_id=body2.identifier,
            contact_point=contact_point,
            contact_normal=contact_normal,
            penetration_depth=penetration_depth,
            relative_velocity=relative_velocity
        )
    
    @staticmethod
    def detect_all_collisions(bodies: List["Body"]) -> List[Collision]:
        """Detect all collisions between bodies in the list."""
        collisions = []
        
        for i in range(len(bodies)):
            for j in range(i + 1, len(bodies)):
                collision = CollisionDetector.detect_sphere_collision(bodies[i], bodies[j])
                if collision:
                    collisions.append(collision)
        
        return collisions


class CollisionResolver:
    """Handles collision resolution and response."""
    
    @staticmethod
    def resolve_collision(collision: Collision, body1: "Body", body2: "Body", dt: float) -> None:
        """Resolve a collision between two bodies using impulse-based response."""
        
        # Calculate relative velocity in collision normal direction
        relative_velocity_normal = collision.relative_velocity.dot(collision.contact_normal)
        
        # Objects are separating, no need to resolve
        if relative_velocity_normal > 0:
            return
        
        # Calculate restitution (bounce factor)
        restitution = min(body1.restitution, body2.restitution)
        
        # Calculate impulse magnitude
        impulse_magnitude = -(1 + restitution) * relative_velocity_normal
        impulse_magnitude /= (1/body1.mass + 1/body2.mass)
        
        # Apply impulse to velocities
        impulse = collision.contact_normal * impulse_magnitude
        body1.velocity -= impulse / body1.mass
        body2.velocity += impulse / body2.mass
        
        # Position correction to prevent sinking
        CollisionResolver._position_correction(collision, body1, body2)
    
    @staticmethod
    def _position_correction(collision: Collision, body1: "Body", body2: "Body") -> None:
        """Apply position correction to prevent bodies from sinking into each other."""
        
        # Percentage of penetration to correct (usually 0.2-0.8)
        correction_percentage = 0.4
        # Slop to allow minor penetrations (prevents jitter)
        slop = 0.01
        
        correction = max(collision.penetration_depth - slop, 0.0) / (1/body1.mass + 1/body2.mass)
        correction *= correction_percentage
        
        correction_vector = collision.contact_normal * correction
        body1.position -= correction_vector / body1.mass
        body2.position += correction_vector / body2.mass


__all__ = [
    "Collision",
    "CollisionDetector", 
    "CollisionResolver"
]