from __future__ import annotations

from dataclasses import dataclass
from math import cos, sin, sqrt
from typing import List

from .vector import Vector3


@dataclass
class ProjectileResult:
    trajectory: List[Vector3]
    time_of_flight: float
    max_height: float
    range: float


def projectile_motion(
    initial_speed: float,
    launch_angle: float,
    initial_height: float = 0.0,
    gravity: float = 9.80665,
    samples: int = 50,
) -> ProjectileResult:
    vx = initial_speed * cos(launch_angle)
    vy = initial_speed * sin(launch_angle)

    discriminant = vy ** 2 + 2 * gravity * initial_height
    time_of_flight = (vy + sqrt(discriminant)) / gravity

    dt = time_of_flight / max(samples - 1, 1)
    trajectory: List[Vector3] = []
    max_height = initial_height

    for i in range(samples):
        t = dt * i
        x = vx * t
        y = initial_height + vy * t - 0.5 * gravity * t ** 2
        max_height = max(max_height, y)
        trajectory.append(Vector3(x, y, 0.0))

    total_range = vx * time_of_flight
    return ProjectileResult(trajectory=trajectory, time_of_flight=time_of_flight, max_height=max_height, range=total_range)


@dataclass
class OscillatorResult:
    trajectory: List[Vector3]
    period: float
    angular_frequency: float


def damped_oscillator(
    mass: float,
    stiffness: float,
    damping: float,
    initial_displacement: float,
    initial_velocity: float,
    duration: float,
    samples: int = 200,
) -> OscillatorResult:
    from math import exp

    omega0 = sqrt(stiffness / mass)
    zeta = damping / (2 * sqrt(mass * stiffness))
    omega_d = omega0 * sqrt(max(1 - zeta ** 2, 0.0))

    trajectory: List[Vector3] = []
    dt = duration / max(samples - 1, 1)

    for i in range(samples):
        t = i * dt
        envelope = exp(-zeta * omega0 * t)
        displacement = envelope * (
            initial_displacement * cos(omega_d * t)
            + ((initial_velocity + zeta * omega0 * initial_displacement) / omega_d if omega_d else 0.0) * sin(omega_d * t)
        )
        trajectory.append(Vector3(t, displacement, 0.0))

    period = (2 * 3.141592653589793 / omega_d) if omega_d else float("inf")
    return OscillatorResult(trajectory=trajectory, period=period, angular_frequency=omega_d)
