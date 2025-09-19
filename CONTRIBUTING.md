# Contributing to Physics Engine Playground

Thank you for your interest in contributing to the Physics Engine Playground! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- **Python 3.11+** for backend development
- **Node.js 18+** for frontend development
- **Git** for version control
- Basic understanding of physics simulation concepts

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ME6A-PL1ER/web.git
   cd web
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   ```

4. **Run the application:**
   ```bash
   # Backend (in backend directory)
   python -m uvicorn app.main:app --reload

   # Frontend (in frontend directory) 
   npm run dev
   ```

## Code Style and Standards

### Python (Backend)

- **Code formatting**: Use `black` with default settings
- **Import sorting**: Use `isort` with black compatibility
- **Linting**: Use `flake8` or `pylint`
- **Type hints**: Use type hints for all public functions
- **Docstrings**: Use Google-style docstrings

Example:
```python
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class PhysicsBody:
    """Represents a rigid body in the simulation.
    
    Args:
        mass: The mass of the body in kg
        position: Initial position vector
        velocity: Initial velocity vector
    """
    mass: float
    position: Vector3
    velocity: Vector3
    
    def apply_force(self, force: Vector3, dt: float) -> None:
        """Apply a force to the body for a given time step.
        
        Args:
            force: Force vector to apply
            dt: Time step duration in seconds
        """
        acceleration = force / self.mass
        self.velocity += acceleration * dt
```

### JavaScript/React (Frontend)

- **Code formatting**: Use Prettier with default settings
- **Linting**: Use ESLint with React hooks plugin
- **Component style**: Use functional components with hooks
- **Naming**: Use PascalCase for components, camelCase for functions/variables

Example:
```javascript
import React, { useState, useEffect } from 'react';

/**
 * SimulationControls component for managing simulation parameters
 * @param {Object} props - Component props
 * @param {Function} props.onParameterChange - Callback for parameter changes
 * @param {Object} props.defaultParams - Default simulation parameters
 */
const SimulationControls = ({ onParameterChange, defaultParams }) => {
  const [parameters, setParameters] = useState(defaultParams);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const newParams = { ...parameters, [name]: Number(value) };
    setParameters(newParams);
    onParameterChange(newParams);
  };

  return (
    <div className="simulation-controls">
      {/* Component JSX */}
    </div>
  );
};

export default SimulationControls;
```

## Architecture Guidelines

### Backend Architecture

```
backend/
├── app/
│   ├── api/v1/endpoints/     # API route handlers
│   └── main.py               # FastAPI application
├── physics/                  # Core physics engine
│   ├── bodies.py            # Body definitions
│   ├── forces.py            # Force implementations
│   ├── integrators.py       # Numerical integration
│   ├── collisions.py        # Collision detection
│   ├── constraints.py       # Constraint system
│   └── simulations.py       # Main simulation engine
└── tests/                   # Unit tests
```

### Frontend Architecture

```
frontend/src/
├── components/              # React components
│   ├── SimulationRunner.jsx # Main simulation interface
│   ├── TrajectoryPlot.jsx   # Chart components  
│   └── BenchmarkRunner.jsx  # Performance testing
├── hooks/                   # Custom React hooks
├── styles.css              # Global styles
└── main.jsx                # Application entry point
```

## Contributing Guidelines

### Issue Reporting

1. **Search existing issues** before creating a new one
2. **Use clear, descriptive titles**
3. **Provide detailed reproduction steps** for bugs
4. **Include system information** (OS, Python/Node.js versions)
5. **Add relevant labels** (bug, enhancement, documentation, etc.)

### Pull Request Process

1. **Fork the repository** and create a feature branch
2. **Write clear commit messages** following conventional commits format:
   ```
   feat: add collision detection for spherical bodies
   fix: resolve energy conservation issue in RK4 integrator
   docs: update API documentation for new endpoints
   test: add unit tests for spring force calculations
   ```

3. **Keep pull requests focused** - one feature/fix per PR
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Ensure all checks pass** (tests, linting, formatting)

### Code Review Guidelines

**For Reviewers:**
- Be constructive and specific in feedback
- Focus on code quality, performance, and maintainability
- Suggest alternatives when pointing out issues
- Approve when the code meets quality standards

**For Contributors:**
- Respond to feedback promptly and professionally
- Make requested changes or discuss alternatives
- Keep the conversation focused on the code

## Testing

### Backend Testing

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app --cov=physics

# Run specific test file
python -m pytest tests/test_physics.py
```

### Frontend Testing

```bash
# Run tests (when test framework is added)
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Guidelines

- **Unit tests** for individual functions/methods
- **Integration tests** for API endpoints
- **Physics tests** for simulation accuracy
- **Performance tests** for benchmarking
- Aim for **80%+ code coverage**

## Physics Implementation Guidelines

### Adding New Forces

1. Implement the `Force` protocol in `physics/forces.py`
2. Add the force type to API validation
3. Write unit tests for the force calculations
4. Update documentation with physics equations

Example:
```python
@dataclass
class MagneticForce:
    """Magnetic force on a charged particle."""
    charge: float
    magnetic_field: Vector3
    
    def compute(self, body: "Body") -> Vector3:
        """F = q(v × B)"""
        return body.velocity.cross(self.magnetic_field) * self.charge
```

### Adding New Integrators

1. Implement in `physics/integrators.py`
2. Follow the established function signature
3. Add stability and accuracy documentation
4. Include the method in simulation options

### Adding New Constraints

1. Inherit from `Constraint` base class in `physics/constraints.py`
2. Implement the `apply` method
3. Consider constraint violation handling
4. Add factory functions for common setups

## Performance Guidelines

### Backend Performance

- **Profile critical paths** using `cProfile`
- **Optimize hot loops** in integration and force calculations
- **Use efficient data structures** (prefer NumPy arrays when beneficial)
- **Minimize memory allocations** in simulation loops

### Frontend Performance

- **Minimize re-renders** using React.memo and useCallback
- **Lazy load large components** 
- **Debounce user inputs** for real-time controls
- **Use efficient charting libraries** for large datasets

## Documentation

### Code Documentation

- **Docstrings** for all public functions and classes
- **Inline comments** for complex algorithms
- **Type annotations** for better IDE support
- **Physics equations** in mathematical notation when relevant

### User Documentation

- **README updates** for new features
- **API documentation** using FastAPI's automatic docs
- **Examples** for common use cases
- **Deployment guides** for different platforms

## Release Process

1. **Update version numbers** in package.json and Python packages
2. **Update CHANGELOG.md** with new features and fixes
3. **Create release notes** highlighting major changes
4. **Tag the release** using semantic versioning (e.g., v1.2.3)
5. **Deploy to staging** for final testing
6. **Deploy to production** after approval

## Community Guidelines

### Communication

- **Be respectful** and inclusive
- **Ask questions** when unclear about requirements
- **Share knowledge** and help other contributors
- **Use GitHub Discussions** for general questions

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- GitHub contributor graphs

## Resources

### Learning Resources

- **Physics**: Classical Mechanics (Goldstein), Game Physics (Millington)
- **Numerical Methods**: Numerical Analysis (Burden & Faires)
- **React**: Official React documentation
- **FastAPI**: Official FastAPI documentation

### Useful Tools

- **Backend**: PyCharm, VS Code with Python extension
- **Frontend**: VS Code with ES7+ React snippets
- **Testing**: pytest, Jest, React Testing Library
- **Debugging**: Python debugger, Chrome DevTools

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check existing docs first
- **Code Review**: Request feedback on draft PRs

Thank you for contributing to the Physics Engine Playground! Your contributions help make physics simulation more accessible and educational.