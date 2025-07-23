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
      className="pointer-events-none fixed z-50 rounded-lg border border-gray-300 bg-white p-3 text-sm shadow-lg"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        marginTop: "-12px",
        maxWidth: "220px",
        minWidth: "180px",
      }}
    >
      <div className="mb-1 font-semibold text-gray-800">Tasks per Hour Formula:</div>
      <div className="mb-1 text-gray-700">{formulaText}</div>
      {timeInHours > 0 ? (
        <div className="font-medium text-gray-600">= {tasksPerHour.toFixed(1)} tasks/hour</div>
      ) : (
        <div className="font-medium text-gray-600">= 0.0 tasks/hour</div>
      )}

      {/* Small arrow pointing down */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 transform"
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid white",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
        }}
      />
    </div>
  );
};
