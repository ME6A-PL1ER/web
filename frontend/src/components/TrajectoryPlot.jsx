import React, { useMemo } from 'react';

const sizeMap = {
  wide: { width: 500, height: 250 },
  square: { width: 300, height: 300 }
};

const TrajectoryPlot = ({ title, points, xLabel, yLabel, aspect = 'square' }) => {
  const { width, height } = sizeMap[aspect] || sizeMap.square;

  const viewBox = `0 0 ${width} ${height}`;
  const { polyline, xTicks, yTicks } = useMemo(() => {
    if (!points || points.length === 0) {
      return { polyline: '', xTicks: [], yTicks: [] };
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const polylinePoints = points
      .map((point) => {
        const x = ((point.x - minX) / rangeX) * (width - 40) + 30;
        const y = height - (((point.y - minY) / rangeY) * (height - 40) + 20);
        return `${x},${y}`;
      })
      .join(' ');

    const tickCount = 5;
    const xTicksData = Array.from({ length: tickCount }, (_, index) => {
      const value = minX + (rangeX * index) / (tickCount - 1);
      const x = ((value - minX) / rangeX) * (width - 40) + 30;
      return { value, x };
    });

    const yTicksData = Array.from({ length: tickCount }, (_, index) => {
      const value = minY + (rangeY * index) / (tickCount - 1);
      const y = height - (((value - minY) / rangeY) * (height - 40) + 20);
      return { value, y };
    });

    return { polyline: polylinePoints, xTicks: xTicksData, yTicks: yTicksData };
  }, [points, width, height]);

  return (
    <div className="plot">
      <h4>{title}</h4>
      {polyline ? (
        <svg viewBox={viewBox} role="img" aria-label={title}>
          <rect x="25" y="15" width={width - 50} height={height - 35} className="plot__background" />
          <polyline points={polyline} className="plot__line" />
          {xTicks.map((tick, index) => (
            <g key={`x-${index}`} transform={`translate(${tick.x}, ${height - 10})`}>
              <line y2="5" className="plot__tick" />
              <text y="15" className="plot__tick-label">
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}
          {yTicks.map((tick, index) => (
            <g key={`y-${index}`} transform={`translate(20, ${tick.y})`}>
              <line x2="5" className="plot__tick" />
              <text x="-5" y="5" className="plot__tick-label" textAnchor="end">
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}
          <text x={width / 2} y={height} className="plot__axis">{xLabel}</text>
          <text x="15" y={height / 2} className="plot__axis" transform={`rotate(-90 15 ${height / 2})`}>
            {yLabel}
          </text>
        </svg>
      ) : (
        <p className="empty">Adjust parameters and run a simulation to see data here.</p>
      )}
    </div>
  );
};

export default TrajectoryPlot;
