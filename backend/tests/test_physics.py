from math import isclose, pi
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.physics.analytics import damped_oscillator, projectile_motion
from backend.physics.simulations import Simulation, create_body
from backend.physics.vector import Vector3


def test_projectile_motion_range():
    result = projectile_motion(initial_speed=10, launch_angle=pi / 4, samples=20)
    assert isclose(result.range, 10.19, rel_tol=0.05)
    assert len(result.trajectory) == 20


def test_damped_oscillator_decay():
    result = damped_oscillator(
        mass=1,
        stiffness=4,
        damping=0.2,
        initial_displacement=1,
        initial_velocity=0,
        duration=6,
        samples=30,
    )
    assert result.angular_frequency > 0
    assert result.trajectory[0].y == 1
    assert result.trajectory[-1].y < result.trajectory[0].y


def test_simulation_energy_profile_is_tracked():
    simulation = Simulation(timestep=0.05, method="rk4")
    simulation.gravity = Vector3(0, -9.81, 0)

    body_a = create_body(
        identifier="mass-a",
        mass=1.5,
        position=[0, 0, 0],
        velocity=[2, 6, 0],
        forces=[{"type": "drag", "coefficient": 0.1}],
    )
    body_b = create_body(
        identifier="mass-b",
        mass=1.0,
        position=[-3, 0, 0],
        velocity=[0, 8, 0],
        forces=[{"type": "constant", "vector": [0, 12, 0]}],
    )
    simulation.add_bodies([body_a, body_b])

    result = simulation.step(steps=10)
    assert result.steps
    assert len(result.conserved_energy) == 10
    assert all(len(snapshot) == 2 for snapshot in result.steps)
