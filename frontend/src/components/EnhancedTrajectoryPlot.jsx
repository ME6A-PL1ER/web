import React, { useRef, useEffect, useState } from 'react';

const EnhancedTrajectoryPlot = ({ 
  title, 
  points, 
  xLabel = "X", 
  yLabel = "Y", 
  aspect = "square",
  enableInteraction = true,
  enableExport = true 
}) => {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = aspect === "wide" ? 400 : 300;
  const height = aspect === "wide" ? 200 : 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calculate data bounds
  const xExtent = points.length > 0 ? [
    Math.min(...points.map(d => d.x)),
    Math.max(...points.map(d => d.x))
  ] : [0, 1];
  
  const yExtent = points.length > 0 ? [
    Math.min(...points.map(d => d.y)),
    Math.max(...points.map(d => d.y))
  ] : [0, 1];

  // Add padding to extents
  const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
  const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
  const xScale = [xExtent[0] - xPadding, xExtent[1] + xPadding];
  const yScale = [yExtent[0] - yPadding, yExtent[1] + yPadding];

  // Scale functions
  const scaleX = (x) => ((x - xScale[0]) / (xScale[1] - xScale[0])) * innerWidth;
  const scaleY = (y) => innerHeight - ((y - yScale[0]) / (yScale[1] - yScale[0])) * innerHeight;

  // Generate path string
  const pathData = points.length > 0 
    ? `M ${scaleX(points[0].x)} ${scaleY(points[0].y)} ` +
      points.slice(1).map(point => `L ${scaleX(point.x)} ${scaleY(point.y)}`).join(' ')
    : '';

  // Generate tick marks
  const xTicks = [];
  const yTicks = [];
  
  for (let i = 0; i <= 5; i++) {
    const xValue = xScale[0] + (xScale[1] - xScale[0]) * (i / 5);
    const yValue = yScale[0] + (yScale[1] - yScale[0]) * (i / 5);
    
    xTicks.push({
      value: xValue,
      position: scaleX(xValue),
      label: xValue.toFixed(1)
    });
    
    yTicks.push({
      value: yValue,
      position: scaleY(yValue),
      label: yValue.toFixed(1)
    });
  }

  // Mouse event handlers for pan/zoom
  const handleMouseDown = (e) => {
    if (!enableInteraction) return;
    setIsDragging(true);
    const rect = svgRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - transform.x,
      y: e.clientY - rect.top - transform.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !enableInteraction) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTransform(prev => ({
      ...prev,
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!enableInteraction) return;
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * scaleFactor))
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      `${xLabel},${yLabel}\n` +
      points.map(point => `${point.x},${point.y}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (enableInteraction) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, enableInteraction]);

  if (points.length === 0) {
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <p>Adjust parameters and run a simulation to see data here.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>{title}</h4>
        {enableInteraction && (
          <div className="chart-controls">
            <button onClick={resetView} className="chart-btn" title="Reset View">
              🔄
            </button>
            {enableExport && (
              <button onClick={exportData} className="chart-btn" title="Export CSV">
                💾
              </button>
            )}
          </div>
        )}
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #333',
          cursor: enableInteraction ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <defs>
          <clipPath id={`clip-${title.replace(/\s+/g, '')}`}>
            <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        
        {/* Background */}
        <rect width={width} height={height} fill="#1a1a1a" />
        
        {/* Chart area background */}
        <rect 
          x={margin.left} 
          y={margin.top} 
          width={innerWidth} 
          height={innerHeight} 
          fill="#2a2a2a" 
        />
        
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          <g opacity="0.3">
            {xTicks.map((tick, i) => (
              <line
                key={`x-grid-${i}`}
                x1={tick.position}
                y1={0}
                x2={tick.position}
                y2={innerHeight}
                stroke="#666"
                strokeWidth="0.5"
              />
            ))}
            {yTicks.map((tick, i) => (
              <line
                key={`y-grid-${i}`}
                x1={0}
                y1={tick.position}
                x2={innerWidth}
                y2={tick.position}
                stroke="#666"
                strokeWidth="0.5"
              />
            ))}
          </g>
          
          {/* Data line with pan/zoom transform */}
          <g 
            clipPath={`url(#clip-${title.replace(/\s+/g, '')})`}
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          >
            <path
              d={pathData}
              fill="none"
              stroke="#00d4ff"
              strokeWidth={2 / transform.scale}
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Data points */}
            {points.map((point, i) => (
              <circle
                key={i}
                cx={scaleX(point.x)}
                cy={scaleY(point.y)}
                r={2 / transform.scale}
                fill="#00d4ff"
                opacity={0.7}
              />
            ))}
          </g>
          
          {/* X-axis */}
          <g transform={`translate(0, ${innerHeight})`}>
            <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="#666" />
            {xTicks.map((tick, i) => (
              <g key={`x-tick-${i}`} transform={`translate(${tick.position}, 0)`}>
                <line y1={0} y2={5} stroke="#666" />
                <text y={18} textAnchor="middle" fill="#ccc" fontSize="10">
                  {tick.label}
                </text>
              </g>
            ))}
          </g>
          
          {/* Y-axis */}
          <g>
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#666" />
            {yTicks.map((tick, i) => (
              <g key={`y-tick-${i}`} transform={`translate(0, ${tick.position})`}>
                <line x1={-5} y1={0} x2={0} y2={0} stroke="#666" />
                <text x={-8} y={3} textAnchor="end" fill="#ccc" fontSize="10">
                  {tick.label}
                </text>
              </g>
            ))}
          </g>
        </g>
        
        {/* Axis labels */}
        <text 
          x={width / 2} 
          y={height - 5} 
          textAnchor="middle" 
          fill="#ccc" 
          fontSize="12"
        >
          {xLabel}
        </text>
        <text 
          x={12} 
          y={height / 2} 
          textAnchor="middle" 
          fill="#ccc" 
          fontSize="12"
          transform={`rotate(-90, 12, ${height / 2})`}
        >
          {yLabel}
        </text>
        
        {/* Instructions overlay */}
        {enableInteraction && (
          <text x={width - 5} y={15} textAnchor="end" fill="#888" fontSize="8">
            Drag to pan • Scroll to zoom
          </text>
        )}
      </svg>
    </div>
  );
};

export default EnhancedTrajectoryPlot;