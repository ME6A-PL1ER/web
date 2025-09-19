import React, { useState, useEffect, useRef } from 'react';

const SimulationAnimation = ({ result, settings, bodies }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);

  const totalSteps = result?.steps?.length || 0;

  // Animation controls
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepChange = (e) => {
    setCurrentStep(parseInt(e.target.value));
  };

  const handleSpeedChange = (e) => {
    setSpeed(parseFloat(e.target.value));
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying && totalSteps > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return totalSteps - 1;
          }
          return prev + 1;
        });
      }, 100 / speed);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, totalSteps]);

  // Canvas rendering
  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (totalSteps === 0 || !result.steps[currentStep]) return;

    // Calculate bounds for all steps
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    result.steps.forEach(step => {
      step.forEach(body => {
        minX = Math.min(minX, body.position[0]);
        maxX = Math.max(maxX, body.position[0]);
        minY = Math.min(minY, body.position[1]);
        maxY = Math.max(maxY, body.position[1]);
      });
    });

    // Add padding
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    const padding = 0.1;
    minX -= xRange * padding;
    maxX += xRange * padding;
    minY -= yRange * padding;
    maxY += yRange * padding;

    // Scale functions
    const scaleX = (x) => ((x - minX) / (maxX - minX)) * (rect.width - 40) + 20;
    const scaleY = (y) => rect.height - 20 - ((y - minY) / (maxY - minY)) * (rect.height - 40);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = (rect.width - 40) * (i / 10) + 20;
      const y = (rect.height - 40) * (i / 10) + 20;
      
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, rect.height - 20);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(rect.width - 20, y);
      ctx.stroke();
    }

    // Draw trajectories (faded)
    if (currentStep > 0) {
      const currentStepData = result.steps[currentStep];
      currentStepData.forEach((bodyData, bodyIndex) => {
        ctx.strokeStyle = `rgba(${120 + bodyIndex * 60}, ${180 + bodyIndex * 30}, 255, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let step = 0; step <= currentStep; step++) {
          const stepData = result.steps[step];
          const body = stepData.find(b => b.body === bodyData.body);
          if (body) {
            const x = scaleX(body.position[0]);
            const y = scaleY(body.position[1]);
            if (step === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      });
    }

    // Draw current positions
    const currentStepData = result.steps[currentStep];
    currentStepData.forEach((bodyData, bodyIndex) => {
      const x = scaleX(bodyData.position[0]);
      const y = scaleY(bodyData.position[1]);
      
      // Find body configuration for radius
      const bodyConfig = bodies.find(b => b.identifier === bodyData.body);
      const radius = bodyConfig?.radius || 1;
      const scaledRadius = Math.max(3, radius * 10);

      // Body circle
      ctx.fillStyle = `rgb(${120 + bodyIndex * 60}, ${180 + bodyIndex * 30}, 255)`;
      ctx.beginPath();
      ctx.arc(x, y, scaledRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Body border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Velocity vector
      const velScale = 10;
      const vx = bodyData.velocity[0] * velScale;
      const vy = bodyData.velocity[1] * velScale;
      
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vx, y - vy);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(-vy, vx);
        const headLength = 5;
        ctx.beginPath();
        ctx.moveTo(x + vx, y - vy);
        ctx.lineTo(
          x + vx - headLength * Math.cos(angle - Math.PI / 6),
          y - vy + headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x + vx, y - vy);
        ctx.lineTo(
          x + vx - headLength * Math.cos(angle + Math.PI / 6),
          y - vy + headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(bodyData.body, x, y - scaledRadius - 5);
    });

    // Draw time and step info
    ctx.fillStyle = '#ccc';
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';
    const time = currentStep * settings.timestep;
    ctx.fillText(`Time: ${time.toFixed(2)}s`, 20, rect.height - 25);
    ctx.fillText(`Step: ${currentStep}/${totalSteps - 1}`, 120, rect.height - 25);

  }, [result, currentStep, settings, bodies, totalSteps]);

  if (!result || totalSteps === 0) {
    return (
      <div className="animation-container">
        <h3>Real-time Animation</h3>
        <p>Run a simulation to see the animation here.</p>
      </div>
    );
  }

  return (
    <div className="animation-container">
      <h3>Real-time Animation</h3>
      
      <canvas 
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid #333',
          borderRadius: '8px',
          background: '#1a1a1a'
        }}
      />
      
      <div className="animation-controls">
        <div className="animation-control-row">
          <button 
            onClick={togglePlayPause}
            className="play-pause-btn"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button 
            onClick={resetAnimation}
            className="chart-btn"
          >
            🔄 Reset
          </button>
          
          <input
            type="range"
            min="0"
            max={totalSteps - 1}
            value={currentStep}
            onChange={handleStepChange}
            className="animation-slider"
          />
          
          <div className="speed-control">
            <label>Speed:</label>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={handleSpeedChange}
            />
            <span>x</span>
          </div>
        </div>
        
        <div className="animation-info">
          <span>Time: {(currentStep * settings.timestep).toFixed(2)}s</span>
          <span>Step: {currentStep}/{totalSteps - 1}</span>
          <span>Yellow vectors show velocity</span>
        </div>
      </div>
    </div>
  );
};

export default SimulationAnimation;