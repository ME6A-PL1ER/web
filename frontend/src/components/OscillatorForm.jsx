import React, { useMemo, useState } from 'react';
import EnhancedTrajectoryPlot from './EnhancedTrajectoryPlot.jsx';
import { useApiBase } from '../hooks/useApiBase.js';

const defaultResult = {
  angular_frequency: 0,
  period: 0,
  trajectory: []
};

const OscillatorForm = () => {
  const [form, setForm] = useState({
    mass: 1,
    stiffness: 10,
    damping: 0.1,
    initial_displacement: 1,
    initial_velocity: 0,
    duration: 20,
    samples: 200
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

  const dataPoints = useMemo(
    () => result.trajectory.map((point) => ({ x: point.time, y: point.displacement })),
    [result]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/oscillator/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        throw new Error('Failed to compute oscillator');
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
        <h3>Damped Oscillator</h3>
        <label>
          Mass (kg)
          <input type="number" name="mass" min="0.01" step="0.01" value={form.mass} onChange={handleChange} />
        </label>
        <label>
          Stiffness (N/m)
          <input type="number" name="stiffness" min="0.01" step="0.1" value={form.stiffness} onChange={handleChange} />
        </label>
        <label>
          Damping (N·s/m)
          <input type="number" name="damping" min="0" step="0.01" value={form.damping} onChange={handleChange} />
        </label>
        <label>
          Initial displacement (m)
          <input
            type="number"
            name="initial_displacement"
            step="0.1"
            value={form.initial_displacement}
            onChange={handleChange}
          />
        </label>
        <label>
          Initial velocity (m/s)
          <input type="number" name="initial_velocity" step="0.1" value={form.initial_velocity} onChange={handleChange} />
        </label>
        <label>
          Duration (s)
          <input type="number" name="duration" min="1" step="1" value={form.duration} onChange={handleChange} />
        </label>
        <label>
          Samples
          <input type="number" name="samples" min="10" max="5000" value={form.samples} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Solving…' : 'Solve'}
        </button>
        {error && <p className="error">{error}</p>}
        <div className="metrics">
          <div><strong>Angular frequency:</strong> {result.angular_frequency.toFixed(3)} rad/s</div>
          <div><strong>Period:</strong> {Number.isFinite(result.period) ? result.period.toFixed(3) : '∞'} s</div>
        </div>
      </form>
      <EnhancedTrajectoryPlot
        title="Displacement over time"
        points={dataPoints}
        xLabel="Time (s)"
        yLabel="Displacement (m)"
        enableInteraction={true}
        enableExport={true}
      />
    </div>
  );
};

export default OscillatorForm;
