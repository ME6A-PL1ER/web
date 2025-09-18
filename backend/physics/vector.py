from __future__ import annotations

from dataclasses import dataclass
from math import sqrt
from typing import Iterable, Tuple


@dataclass(frozen=True)
class Vector3:
    """Simple immutable 3D vector with basic arithmetic helpers.

    The engine intentionally keeps a small footprint so that it can run on
    minimal environments such as Alpine Linux where compiled dependencies are
    harder to install.  All operations use pure Python and the standard library.
    """

    x: float
    y: float
    z: float = 0.0

    def __add__(self, other: "Vector3") -> "Vector3":
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __sub__(self, other: "Vector3") -> "Vector3":
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)

    def __mul__(self, scalar: float) -> "Vector3":
        return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)

    __rmul__ = __mul__

    def __truediv__(self, scalar: float) -> "Vector3":
        if scalar == 0:
            raise ZeroDivisionError("Cannot divide a vector by zero")
        return Vector3(self.x / scalar, self.y / scalar, self.z / scalar)

    def magnitude(self) -> float:
        return sqrt(self.x ** 2 + self.y ** 2 + self.z ** 2)

    def normalize(self) -> "Vector3":
        mag = self.magnitude()
        if mag == 0:
            return Vector3(0.0, 0.0, 0.0)
        return self / mag

    def dot(self, other: "Vector3") -> float:
        return self.x * other.x + self.y * other.y + self.z * other.z

    def cross(self, other: "Vector3") -> "Vector3":
        return Vector3(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x,
        )

    def to_tuple(self) -> Tuple[float, float, float]:
        return self.x, self.y, self.z

    @classmethod
    def from_iterable(cls, values: Iterable[float]) -> "Vector3":
        x, y, *rest = list(values)
        z = rest[0] if rest else 0.0
        return cls(float(x), float(y), float(z))


ZERO_VECTOR = Vector3(0.0, 0.0, 0.0)
