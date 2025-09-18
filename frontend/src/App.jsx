import React from 'react';
import SectionCard from './components/SectionCard.jsx';
import ProjectileForm from './components/ProjectileForm.jsx';
import OscillatorForm from './components/OscillatorForm.jsx';
import SimulationRunner from './components/SimulationRunner.jsx';

const App = () => {
  return (
    <div className="app">
      <header className="hero">
        <h1>Physics Engine Playground</h1>
        <p>
          Explore classical mechanics simulations through an API-powered playground.
          Adjust parameters, run high fidelity numerical solvers, and inspect charts
          generated directly from the FastAPI backend running a pure Python physics engine.
        </p>
        <a className="primary" href="https://fastapi.tiangolo.com/" target="_blank" rel="noreferrer">
          FastAPI Docs
        </a>
      </header>

      <main>
        <SectionCard
          title="Projectile motion"
          description="Analytical solver for parabolic trajectories with configurable launch conditions."
        >
          <ProjectileForm />
        </SectionCard>

        <SectionCard
          title="Damped harmonic oscillator"
          description="Visualise how damping and stiffness shape oscillations over time."
        >
          <OscillatorForm />
        </SectionCard>

        <SectionCard
          title="Multi-body numerical integrator"
          description="Run RK4 or Euler integration on multiple rigid bodies with drag and thrust forces."
        >
          <SimulationRunner />
        </SectionCard>
      </main>

      <footer>
        <p>
          Built with FastAPI, React, and pure Python numerics to remain portable on Alpine Linux. Configure the
          <code>VITE_API_URL</code> environment variable to point the UI to a remote backend instance.
        </p>
      </footer>
    </div>
  );
};

export default App;
