import React, { useMemo, useState } from 'react';
import TrajectoryPlot from './TrajectoryPlot.jsx';
import { useApiBase } from '../hooks/useApiBase.js';

const defaultResult = {
  time_of_flight: 0,
  max_height: 0,
  range: 0,
  trajectory: []
};

const ProjectileForm = () => {
  const [form, setForm] = useState({
    initial_speed: 20,
    launch_angle: 45,
    initial_height: 0,
    gravity: 9.80665,
    samples: 50
  });
  const [result, setResult] = useState(defaultResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = useApiBase();

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericValue = Number(value);
    setForm((prev) => ({ ...prev, [name]: Number.isNaN(numericValue) ? 0 : numericValue }));
  };

  const trajectoryPoints = useMemo(
    () => result.trajectory.map((point) => ({ x: point.x, y: point.y })),
    [result]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/projectile/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        throw new Error('Failed to compute projectile motion');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(defaultResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-grid">
      <form onSubmit={onSubmit} className="form">
        <h3>Projectile Motion</h3>
        <label>
          Initial speed (m/s)
          <input
            type="number"
            name="initial_speed"
            min="0"
            step="0.1"
            value={form.initial_speed}
            onChange={handleChange}
          />
        </label>
        <label>
          Launch angle (°)
          <input
            type="number"
            name="launch_angle"
            min="0"
            max="180"
            step="1"
            value={form.launch_angle}
            onChange={handleChange}
          />
        </label>
        <label>
          Initial height (m)
          <input
            type="number"
            name="initial_height"
            min="0"
            step="0.1"
            value={form.initial_height}
            onChange={handleChange}
          />
        </label>
        <label>
          Gravity (m/s²)
          <input
            type="number"
            name="gravity"
            min="0"
            step="0.001"
            value={form.gravity}
            onChange={handleChange}
          />
        </label>
        <label>
          Samples
          <input
            type="number"
            name="samples"
            min="10"
            max="1000"
            value={form.samples}
            onChange={handleChange}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Simulating…' : 'Simulate'}
        </button>
        {error && <p className="error">{error}</p>}
        <div className="metrics">
          <div><strong>Time of flight:</strong> {result.time_of_flight.toFixed(2)} s</div>
          <div><strong>Max height:</strong> {result.max_height.toFixed(2)} m</div>
          <div><strong>Range:</strong> {result.range.toFixed(2)} m</div>
        </div>
      </form>
      <TrajectoryPlot
        title="Trajectory"
        points={trajectoryPoints}
        xLabel="Horizontal position (m)"
        yLabel="Vertical position (m)"
        aspect="wide"
      />
    </div>
  );
};

export default ProjectileForm;
