import React, { useMemo, useState } from 'react';
import TrajectoryPlot from './TrajectoryPlot.jsx';
import EnhancedTrajectoryPlot from './EnhancedTrajectoryPlot.jsx';
import SimulationAnimation from './SimulationAnimation.jsx';
import { HelpTooltip, ErrorMessage, InfoBox, ParameterHelp } from './HelpComponents.jsx';
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
    drag: 0.2,
    friction: 0,
    radius: 1.0,
    restitution: 0.5
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
    drag: 0,
    friction: 0,
    radius: 1.5,
    restitution: 0.8
  }
];

const SimulationRunner = () => {
  const [settings, setSettings] = useState({
    timestep: 0.02,
    method: 'rk4',
    steps: 200,
    gravityX: 0,
    gravityY: -9.80665,
    enableCollisions: false
  });
  const [bodies, setBodies] = useState(initialBodies);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = useApiBase();

  const handleSettingChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'method') {
      setSettings((prev) => ({ ...prev, [name]: value }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: Number(value) }));
    }
    // Clear error when user makes changes
    if (error) setError(null);
  };

  const dismissError = () => {
    setError(null);
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
        drag: 0,
        friction: 0,
        radius: 1.0,
        restitution: 0.5
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
    enable_collisions: settings.enableCollisions,
    bodies: bodies.map((body) => {
      const forces = [];
      if (body.thrustX || body.thrustY) {
        forces.push({ type: 'constant', vector: [body.thrustX, body.thrustY, 0] });
      }
      if (body.drag > 0) {
        forces.push({ type: 'drag', coefficient: body.drag });
      }
      if (body.friction > 0) {
        forces.push({ type: 'friction', coefficient_kinetic: body.friction });
      }
      return {
        identifier: body.identifier,
        mass: body.mass,
        position: [body.positionX, body.positionY, 0],
        velocity: [body.velocityX, body.velocityY, 0],
        radius: body.radius,
        restitution: body.restitution,
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

  const exportSimulationData = (result, settings, bodies) => {
    const data = {
      metadata: {
        timestamp: new Date().toISOString(),
        settings: settings,
        bodies: bodies.map(b => ({
          identifier: b.identifier,
          mass: b.mass,
          initialPosition: [b.positionX, b.positionY],
          initialVelocity: [b.velocityX, b.velocityY],
          drag: b.drag,
          thrust: [b.thrustX, b.thrustY],
          friction: b.friction,
          radius: b.radius,
          restitution: b.restitution
        })),
        totalSimulatedTime: result.total_time,
        collisionCount: result.collision_count || 0
      },
      simulation_steps: result.steps,
      energy_profile: result.energy_profile
    };

    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", `simulation_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <InfoBox type="tip" title="Simulation Tips">
        Start with small time steps (0.01-0.02s) and fewer steps (100-200) for quick experiments. 
        Enable collisions to see realistic body interactions. Use RK4 for accuracy or Euler for speed.
      </InfoBox>
      
      <form className="form" onSubmit={runSimulation}>
        <h3>Multi-body Simulation</h3>
        <div className="grid-two">
          <HelpTooltip content={ParameterHelp.timestep}>
            <label>
              Time step (s)
              <input type="number" step="0.001" name="timestep" value={settings.timestep} onChange={handleSettingChange} />
            </label>
          </HelpTooltip>
          <HelpTooltip content={ParameterHelp.steps}>
            <label>
              Steps
              <input type="number" name="steps" min="1" max="2000" value={settings.steps} onChange={handleSettingChange} />
            </label>
          </HelpTooltip>
          <HelpTooltip content={ParameterHelp.method}>
            <label>
              Integrator
              <select name="method" value={settings.method} onChange={handleSettingChange}>
                <option value="rk4">Runge–Kutta 4</option>
                <option value="euler">Euler</option>
              </select>
            </label>
          </HelpTooltip>
          <HelpTooltip content={ParameterHelp.gravity}>
            <label>
              Gravity X
              <input type="number" step="0.1" name="gravityX" value={settings.gravityX} onChange={handleSettingChange} />
            </label>
          </HelpTooltip>
          <HelpTooltip content={ParameterHelp.gravity}>
            <label>
              Gravity Y
              <input type="number" step="0.1" name="gravityY" value={settings.gravityY} onChange={handleSettingChange} />
            </label>
          </HelpTooltip>
          <HelpTooltip content={ParameterHelp.collisions}>
            <label>
              <input 
                type="checkbox" 
                name="enableCollisions" 
                checked={settings.enableCollisions} 
                onChange={handleSettingChange} 
              />
              Enable Collisions
            </label>
          </HelpTooltip>
        </div>
        <div className="body-list">
          {bodies.map((body, index) => (
            <div className="body-card" key={body.identifier}>
              <div className="body-header">
                <h4>{body.identifier}</h4>
                {bodies.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeBody(index)} 
                    className="ghost"
                    aria-label={`Remove ${body.identifier} body`}
                  >
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
                <label>
                  Friction coefficient
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={body.friction}
                    onChange={(event) => updateBody(index, 'friction', event.target.value)}
                  />
                </label>
                <label>
                  Radius (m)
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={body.radius}
                    onChange={(event) => updateBody(index, 'radius', event.target.value)}
                  />
                </label>
                <label>
                  Restitution (bounce)
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={body.restitution}
                    onChange={(event) => updateBody(index, 'restitution', event.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="actions">
          <button 
            type="button" 
            onClick={addBody} 
            className="ghost"
            aria-label="Add a new body to the simulation"
          >
            Add body
          </button>
          <button 
            type="submit" 
            disabled={loading}
            aria-label={loading ? 'Simulation running, please wait' : 'Start physics simulation'}
          >
            {loading ? 'Running…' : 'Run simulation'}
          </button>
        </div>
        {error && <ErrorMessage error={error} onDismiss={dismissError} />}
      </form>

      {result && (
        <div className="results">
          <h3>Results</h3>
          <p>Total simulated time: {result.total_time.toFixed(2)} s</p>
          {settings.enableCollisions && (
            <p>Collisions detected: <strong>{result.collision_count || 0}</strong></p>
          )}
          
          {/* Real-time Animation */}
          <SimulationAnimation 
            result={result} 
            settings={settings} 
            bodies={bodies} 
          />
          
          <div className="result-grid">
            {Object.entries(timeline).map(([id, points]) => (
              <EnhancedTrajectoryPlot
                key={id}
                title={`Height of ${id}`}
                points={points}
                xLabel="Time (s)"
                yLabel="Height (m)"
                aspect="wide"
                enableInteraction={true}
                enableExport={true}
              />
            ))}
          </div>
          <EnhancedTrajectoryPlot
            title="Energy profile"
            points={(result.energy_profile || []).map((energy, index) => ({
              x: index * settings.timestep,
              y: energy
            }))}
            xLabel="Time (s)"
            yLabel="Energy (J)"
            enableInteraction={true}
            enableExport={true}
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
          
          {/* Export All Data Button */}
          <div className="actions">
            <button 
              onClick={() => exportSimulationData(result, settings, bodies)} 
              className="ghost"
            >
              📁 Export Full Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationRunner;
