import React, { useState, useMemo } from 'react';
import TrajectoryPlot from './TrajectoryPlot.jsx';
import { useApiBase } from '../hooks/useApiBase.js';

const defaultBenchmarkSettings = {
  body_counts: [1, 2, 5, 10, 20],
  step_counts: [50, 100, 200, 500],
  timestep: 0.02,
  method: 'rk4',
  iterations: 3
};

const BenchmarkRunner = () => {
  const [settings, setSettings] = useState(defaultBenchmarkSettings);
  const [result, setResult] = useState(null);
  const [systemLimits, setSystemLimits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = useApiBase();

  const handleSettingChange = (event) => {
    const { name, value } = event.target;
    if (name === 'method') {
      setSettings(prev => ({ ...prev, [name]: value }));
    } else if (name === 'body_counts' || name === 'step_counts') {
      // Parse comma-separated values
      const numbers = value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n));
      setSettings(prev => ({ ...prev, [name]: numbers }));
    } else {
      setSettings(prev => ({ ...prev, [name]: Number(value) || 0 }));
    }
  };

  const runBenchmark = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/benchmark/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        throw new Error('Benchmark failed');
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

  const loadSystemLimits = async () => {
    try {
      const response = await fetch(`${baseUrl}/benchmark/system-limits`);
      if (response.ok) {
        const data = await response.json();
        setSystemLimits(data);
      }
    } catch (err) {
      console.warn('Could not load system limits:', err);
    }
  };

  // Load system limits on component mount
  React.useEffect(() => {
    loadSystemLimits();
  }, [baseUrl]);

  // Process benchmark results for visualization
  const chartData = useMemo(() => {
    if (!result) return {};
    
    const bodyCountData = {};
    const stepCountData = {};
    
    // Group by body count for performance vs steps chart
    result.results.forEach(r => {
      if (!bodyCountData[r.body_count]) {
        bodyCountData[r.body_count] = [];
      }
      bodyCountData[r.body_count].push({
        x: r.step_count,
        y: r.execution_time * 1000 // Convert to milliseconds
      });
    });
    
    // Group by step count for performance vs bodies chart  
    result.results.forEach(r => {
      if (!stepCountData[r.step_count]) {
        stepCountData[r.step_count] = [];
      }
      stepCountData[r.step_count].push({
        x: r.body_count,
        y: r.execution_time * 1000 // Convert to milliseconds
      });
    });
    
    return { bodyCountData, stepCountData };
  }, [result]);

  const formatArray = (arr) => arr.join(', ');

  return (
    <div className="benchmark">
      <form className="form" onSubmit={runBenchmark}>
        <h3>Performance Benchmark</h3>
        <p>Test simulation performance across different body counts and time steps to understand scaling limits.</p>
        
        <div className="grid-two">
          <label>
            Body Counts (comma-separated)
            <input 
              type="text" 
              name="body_counts" 
              value={formatArray(settings.body_counts)} 
              onChange={handleSettingChange}
              placeholder="1, 2, 5, 10, 20"
            />
          </label>
          <label>
            Step Counts (comma-separated)
            <input 
              type="text" 
              name="step_counts" 
              value={formatArray(settings.step_counts)} 
              onChange={handleSettingChange}
              placeholder="50, 100, 200, 500"
            />
          </label>
          <label>
            Time step (s)
            <input 
              type="number" 
              step="0.001" 
              name="timestep" 
              value={settings.timestep} 
              onChange={handleSettingChange} 
            />
          </label>
          <label>
            Integration Method
            <select name="method" value={settings.method} onChange={handleSettingChange}>
              <option value="rk4">Runge–Kutta 4</option>
              <option value="euler">Euler</option>
            </select>
          </label>
          <label>
            Test Iterations
            <input 
              type="number" 
              min="1" 
              max="10" 
              name="iterations" 
              value={settings.iterations} 
              onChange={handleSettingChange} 
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Running Benchmark...' : 'Run Benchmark'}
        </button>
        
        {error && <p className="error">{error}</p>}
      </form>

      {systemLimits && (
        <div className="system-info">
          <h4>System Recommendations</h4>
          <p><strong>Max Bodies:</strong> {systemLimits.recommended_max_bodies}</p>
          <p><strong>Max Steps:</strong> {systemLimits.recommended_max_steps}</p>
          <div className="performance-notes">
            <h5>Performance Notes:</h5>
            <ul>
              {systemLimits.performance_notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && (
        <div className="results">
          <h3>Benchmark Results</h3>
          <p>Integration Method: <strong>{result.test_parameters.method}</strong></p>
          <p>Timestep: <strong>{result.test_parameters.timestep}s</strong></p>
          <p>Iterations per test: <strong>{result.test_parameters.iterations}</strong></p>
          
          <div className="result-grid">
            {/* Performance vs Steps for different body counts */}
            {Object.entries(chartData.bodyCountData).map(([bodyCount, points]) => (
              <TrajectoryPlot
                key={`bodies-${bodyCount}`}
                title={`Performance vs Steps (${bodyCount} bodies)`}
                points={points.sort((a, b) => a.x - b.x)}
                xLabel="Number of Steps"
                yLabel="Execution Time (ms)"
                aspect="wide"
              />
            ))}
            
            {/* Performance vs Bodies for different step counts */}
            {Object.entries(chartData.stepCountData).map(([stepCount, points]) => (
              <TrajectoryPlot
                key={`steps-${stepCount}`}
                title={`Performance vs Bodies (${stepCount} steps)`}
                points={points.sort((a, b) => a.x - b.x)}
                xLabel="Number of Bodies"
                yLabel="Execution Time (ms)"
                aspect="wide"
              />
            ))}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Bodies</th>
                  <th>Steps</th>
                  <th>Total Time (ms)</th>
                  <th>Time per Step (ms)</th>
                  <th>Time per Body-Step (ms)</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.body_count}</td>
                    <td>{entry.step_count}</td>
                    <td>{(entry.execution_time * 1000).toFixed(2)}</td>
                    <td>{(entry.time_per_step * 1000).toFixed(3)}</td>
                    <td>{(entry.time_per_body_step * 1000).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkRunner;