import React, { useMemo, useState } from 'react';
import TrajectoryPlot from './TrajectoryPlot.jsx';
import { useApiBase } from '../hooks/useApiBase.js';

const initialBodies = [
  {
    identifier: 'projectile',
    mass: 1,
    positionX: 0,
    positionY: 0,
    velocityX: 8,
    velocityY: 14,
    thrustX: 0,
    thrustY: 0,
    drag: 0.2
  },
  {
    identifier: 'companion',
    mass: 2,
    positionX: -5,
    positionY: 0,
    velocityX: 6,
    velocityY: 10,
    thrustX: 0,
    thrustY: 0,
    drag: 0
  }
];

const SimulationRunner = () => {
  const [settings, setSettings] = useState({
    timestep: 0.02,
    method: 'rk4',
    steps: 200,
    gravityX: 0,
    gravityY: -9.80665
  });
  const [bodies, setBodies] = useState(initialBodies);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = useApiBase();

  const handleSettingChange = (event) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: name === 'method' ? value : Number(value) }));
  };

  const updateBody = (index, field, value) => {
    setBodies((prev) =>
      prev.map((body, i) => {
        if (i !== index) return body;
        const numericValue = typeof value === 'number' ? value : Number(value);
        return { ...body, [field]: Number.isNaN(numericValue) ? 0 : numericValue };
      })
    );
  };

  const addBody = () => {
    const count = bodies.length + 1;
    setBodies((prev) => [
      ...prev,
      {
        identifier: `body-${count}`,
        mass: 1,
        positionX: 0,
        positionY: 0,
        velocityX: 0,
        velocityY: 0,
        thrustX: 0,
        thrustY: 0,
        drag: 0
      }
    ]);
  };

  const removeBody = (index) => {
    setBodies((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => ({
    timestep: settings.timestep,
    method: settings.method,
    gravity: [settings.gravityX, settings.gravityY, 0],
    steps: settings.steps,
    bodies: bodies.map((body) => {
      const forces = [];
      if (body.thrustX || body.thrustY) {
        forces.push({ type: 'constant', vector: [body.thrustX, body.thrustY, 0] });
      }
      if (body.drag > 0) {
        forces.push({ type: 'drag', coefficient: body.drag });
      }
      return {
        identifier: body.identifier,
        mass: body.mass,
        position: [body.positionX, body.positionY, 0],
        velocity: [body.velocityX, body.velocityY, 0],
        forces
      };
    })
  });

  const runSimulation = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = buildPayload();
      const response = await fetch(`${baseUrl}/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Simulation failed');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const timeline = useMemo(() => {
    if (!result) return {};
    const map = {};
    result.steps.forEach((step, stepIndex) => {
      step.forEach((item) => {
        if (!map[item.body]) {
          map[item.body] = [];
        }
        map[item.body].push({ x: stepIndex * settings.timestep, y: item.position[1] });
      });
    });
    return map;
  }, [result, settings.timestep]);

  return (
    <div className="simulation">
      <form className="form" onSubmit={runSimulation}>
        <h3>Multi-body Simulation</h3>
        <div className="grid-two">
          <label>
            Time step (s)
            <input type="number" step="0.001" name="timestep" value={settings.timestep} onChange={handleSettingChange} />
          </label>
          <label>
            Steps
            <input type="number" name="steps" min="1" max="2000" value={settings.steps} onChange={handleSettingChange} />
          </label>
          <label>
            Integrator
            <select name="method" value={settings.method} onChange={handleSettingChange}>
              <option value="rk4">Runge–Kutta 4</option>
              <option value="euler">Euler</option>
            </select>
          </label>
          <label>
            Gravity X
            <input type="number" step="0.1" name="gravityX" value={settings.gravityX} onChange={handleSettingChange} />
          </label>
          <label>
            Gravity Y
            <input type="number" step="0.1" name="gravityY" value={settings.gravityY} onChange={handleSettingChange} />
          </label>
        </div>
        <div className="body-list">
          {bodies.map((body, index) => (
            <div className="body-card" key={body.identifier}>
              <div className="body-header">
                <h4>{body.identifier}</h4>
                {bodies.length > 1 && (
                  <button type="button" onClick={() => removeBody(index)} className="ghost">
                    Remove
                  </button>
                )}
              </div>
              <div className="grid-three">
                <label>
                  Mass (kg)
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={body.mass}
                    onChange={(event) => updateBody(index, 'mass', event.target.value)}
                  />
                </label>
                <label>
                  Pos X (m)
                  <input
                    type="number"
                    step="0.1"
                    value={body.positionX}
                    onChange={(event) => updateBody(index, 'positionX', event.target.value)}
                  />
                </label>
                <label>
                  Pos Y (m)
                  <input
                    type="number"
                    step="0.1"
                    value={body.positionY}
                    onChange={(event) => updateBody(index, 'positionY', event.target.value)}
                  />
                </label>
                <label>
                  Vel X (m/s)
                  <input
                    type="number"
                    step="0.1"
                    value={body.velocityX}
                    onChange={(event) => updateBody(index, 'velocityX', event.target.value)}
                  />
                </label>
                <label>
                  Vel Y (m/s)
                  <input
                    type="number"
                    step="0.1"
                    value={body.velocityY}
                    onChange={(event) => updateBody(index, 'velocityY', event.target.value)}
                  />
                </label>
                <label>
                  Drag coefficient
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={body.drag}
                    onChange={(event) => updateBody(index, 'drag', event.target.value)}
                  />
                </label>
                <label>
                  Thrust X (N)
                  <input
                    type="number"
                    step="0.1"
                    value={body.thrustX}
                    onChange={(event) => updateBody(index, 'thrustX', event.target.value)}
                  />
                </label>
                <label>
                  Thrust Y (N)
                  <input
                    type="number"
                    step="0.1"
                    value={body.thrustY}
                    onChange={(event) => updateBody(index, 'thrustY', event.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={addBody} className="ghost">
            Add body
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Running…' : 'Run simulation'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className="results">
          <h3>Results</h3>
          <p>Total simulated time: {result.total_time.toFixed(2)} s</p>
          <div className="result-grid">
            {Object.entries(timeline).map(([id, points]) => (
              <TrajectoryPlot
                key={id}
                title={`Height of ${id}`}
                points={points}
                xLabel="Time (s)"
                yLabel="Height (m)"
                aspect="wide"
              />
            ))}
          </div>
          <TrajectoryPlot
            title="Energy profile"
            points={(result.energy_profile || []).map((energy, index) => ({
              x: index * settings.timestep,
              y: energy
            }))}
            xLabel="Time (s)"
            yLabel="Energy (J)"
          />
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Body</th>
                  <th>Step</th>
                  <th>Position (m)</th>
                  <th>Velocity (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((step, index) =>
                  step.map((entry) => (
                    <tr key={`${entry.body}-${index}`}>
                      <td>{entry.body}</td>
                      <td>{index}</td>
                      <td>{entry.position.map((value) => value.toFixed(2)).join(', ')}</td>
                      <td>{entry.velocity.map((value) => value.toFixed(2)).join(', ')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationRunner;
