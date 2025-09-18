from __future__ import annotations

from typing import Callable

from .vector import Vector3

StateFunction = Callable[[float, "Vector3", "Vector3"], "Vector3"]


def euler_step(
    dt: float,
    position: Vector3,
    velocity: Vector3,
    acceleration: Vector3,
) -> tuple[Vector3, Vector3]:
    new_velocity = velocity + acceleration * dt
    new_position = position + new_velocity * dt
    return new_position, new_velocity


def rk4_step(
    dt: float,
    position: Vector3,
    velocity: Vector3,
    acceleration_func: Callable[[Vector3, Vector3], Vector3],
) -> tuple[Vector3, Vector3]:
    # Runge–Kutta 4 integration for both position and velocity.
    def dv(pos: Vector3, vel: Vector3) -> Vector3:
        return acceleration_func(pos, vel)

    k1_v = dv(position, velocity)
    k1_p = velocity

    k2_v = dv(position + k1_p * (dt / 2), velocity + k1_v * (dt / 2))
    k2_p = velocity + k1_v * (dt / 2)

    k3_v = dv(position + k2_p * (dt / 2), velocity + k2_v * (dt / 2))
    k3_p = velocity + k2_v * (dt / 2)

    k4_v = dv(position + k3_p * dt, velocity + k3_v * dt)
    k4_p = velocity + k3_v * dt

    new_velocity = velocity + (k1_v + 2 * k2_v + 2 * k3_v + k4_v) * (dt / 6)
    new_position = position + (k1_p + 2 * k2_p + 2 * k3_p + k4_p) * (dt / 6)

    return new_position, new_velocity


__all__ = ["euler_step", "rk4_step"]
