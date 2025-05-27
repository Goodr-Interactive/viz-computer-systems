import React from "react";

interface PipelineTooltipProps {
  x: number;
  y: number;
  instructionName: string;
  stageName: string;
  timeLabel: string;
}

export const PipelineTooltip: React.FC<PipelineTooltipProps> = ({
  x,
  y,
  instructionName,
  stageName,
  timeLabel,
}) => {
  return (
    <g className="tooltip" transform={`translate(${x + 10}, ${y - 10})`}>
      <rect
        fill="white"
        stroke="black"
        rx={5}
        ry={5}
        width={220}
        height={60}
        opacity={0.9}
      />
      <text x={10} y={20}>
        {`Laundry: ${instructionName}`}
      </text>
      <text x={10} y={40}>
        {`Stage: ${stageName} (${timeLabel})`}
      </text>
    </g>
  );
};
