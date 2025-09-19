import React from 'react';

const HelpTooltip = ({ children, content }) => {
  return (
    <div className="help-tooltip">
      {children}
      <span className="help-icon" title={content}>?</span>
      <div className="help-content">
        {content}
      </div>
    </div>
  );
};

const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;

  const getErrorHelp = (errorMessage) => {
    if (errorMessage.includes('Failed to fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the physics engine. Please check that the backend server is running.',
        suggestions: [
          'Verify the backend server is started (usually on port 8000)',
          'Check your network connection',
          'Try refreshing the page'
        ]
      };
    }
    
    if (errorMessage.includes('Simulation failed')) {
      return {
        title: 'Simulation Error',
        message: 'The physics simulation encountered an error during execution.',
        suggestions: [
          'Check that all body parameters are valid (positive mass, realistic values)',
          'Reduce the number of simulation steps if using large values',
          'Verify collision settings are appropriate for your scenario'
        ]
      };
    }

    if (errorMessage.includes('validation')) {
      return {
        title: 'Input Validation Error',
        message: 'One or more input parameters are invalid.',
        suggestions: [
          'Ensure all masses are positive numbers',
          'Check that position and velocity values are valid numbers',
          'Verify time step is greater than 0 and less than 1'
        ]
      };
    }

    return {
      title: 'Error',
      message: errorMessage,
      suggestions: ['Please try again or contact support if the problem persists']
    };
  };

  const errorInfo = getErrorHelp(error);

  return (
    <div className="error-message">
      <div className="error-header">
        <span className="error-icon">⚠️</span>
        <h4>{errorInfo.title}</h4>
        {onDismiss && (
          <button className="error-dismiss" onClick={onDismiss} title="Dismiss">
            ×
          </button>
        )}
      </div>
      <p className="error-description">{errorInfo.message}</p>
      {errorInfo.suggestions && (
        <div className="error-suggestions">
          <strong>Suggestions:</strong>
          <ul>
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InfoBox = ({ type = 'info', title, children }) => {
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
    success: '✅'
  };

  return (
    <div className={`info-box ${type}`}>
      <div className="info-header">
        <span className="info-icon">{icons[type]}</span>
        <strong>{title}</strong>
      </div>
      <div className="info-content">{children}</div>
    </div>
  );
};

const ParameterHelp = {
  timestep: "The time interval between simulation steps. Smaller values give more accurate results but take longer to compute. Typical range: 0.001 - 0.1 seconds.",
  
  steps: "Number of simulation steps to compute. More steps = longer simulation time. Each step advances time by the timestep amount.",
  
  method: "Integration method for solving differential equations. RK4 is more accurate but slower, Euler is faster but less accurate for the same timestep.",
  
  gravity: "Gravitational acceleration vector. Default is Earth gravity (0, -9.81, 0). Use (0, 0, 0) for space simulations.",
  
  mass: "Mass of the body in kilograms. Must be positive. Heavier objects are harder to accelerate but have more momentum.",
  
  position: "Initial position of the body in meters. Format: X, Y coordinates where Y is height (positive = up).",
  
  velocity: "Initial velocity of the body in meters per second. Format: X velocity, Y velocity.",
  
  radius: "Radius of the body for collision detection. Only matters when collisions are enabled.",
  
  restitution: "Bounciness of the body (0 = no bounce, 1 = perfect bounce). Only used in collisions.",
  
  friction: "Friction coefficient for collision response. Higher values create more friction during collisions.",
  
  drag: "Air resistance coefficient. Higher values create more drag force opposing motion.",
  
  thrust: "Constant force applied to the body throughout the simulation.",

  collisions: "Enable physics-based collision detection and response between bodies. Bodies will bounce off each other based on their properties."
};

export { HelpTooltip, ErrorMessage, InfoBox, ParameterHelp };