import React from "react";

interface MetricTooltipProps {
  completedTasks: number;
  timeInHours: number;
  isVisible: boolean;
  x: number;
  y: number;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({
  completedTasks,
  timeInHours,
  isVisible,
  x,
  y,
}) => {
  if (!isVisible) return null;

  const tasksPerHour = timeInHours > 0 ? completedTasks / timeInHours : 0;
  const formulaText = `${completedTasks} tasks / ${timeInHours.toFixed(1)} hours`;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
        maxWidth: '220px',
        minWidth: '180px'
      }}
    >
      <div className="font-semibold text-gray-800 mb-1">Tasks per Hour Formula:</div>
      <div className="text-gray-700 mb-1">{formulaText}</div>
      {timeInHours > 0 ? (
        <div className="text-gray-600 font-medium">
          = {tasksPerHour.toFixed(1)} tasks/hour
        </div>
      ) : (
        <div className="text-gray-600 font-medium">
          = 0.0 tasks/hour
        </div>
      )}
      
      {/* Small arrow pointing down */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 top-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid white',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};
