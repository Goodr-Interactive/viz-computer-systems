import React from "react";
import type { Instruction } from "./types";

interface PipelineTooltipProps {
  x: number;
  y: number;
  instructionName: string;
  stageName: string;
  timeLabel: string;
  instruction?: Instruction;
  stageDuration?: number;
}

export const PipelineTooltip: React.FC<PipelineTooltipProps> = ({
  x,
  y,
  instructionName,
  stageName,
  timeLabel,
  instruction,
  stageDuration,
}) => {
  // Calculate additional height if we need to show stall information
  const baseHeight = 60;
  const progressHeight = (instruction?.stageProgress && instruction?.stageProgress > 1) ? 20 : 0;
  const stallHeight = instruction?.stalled ? 20 : 0;
  const totalHeight = baseHeight + progressHeight + stallHeight;

  return (
    <g className="tooltip" transform={`translate(${x + 10}, ${y - 10})`}>
      <rect
        fill="white"
        stroke="black"
        rx={5}
        ry={5}
        width={220}
        height={totalHeight}
        opacity={0.9}
      />
      <text x={10} y={20}>
        {`Instruction: ${instructionName}`}
      </text>
      <text x={10} y={40}>
        {`Stage: ${stageName} (${timeLabel})`}
      </text>
      
      {/* Show progress information for multi-cycle stages */}
      {instruction?.stageProgress && instruction?.stageProgress > 1 && (
        <text x={10} y={60} fill={instruction.stalled ? "red" : "black"}>
          {`Progress: ${instruction.stageProgress}/${stageDuration || instruction.stageDuration || '?'} cycles`}
        </text>
      )}
      
      {/* Show stall information if the instruction is stalled */}
      {instruction?.stalled && (
        <text x={10} y={60 + progressHeight} fill="red">
          {`Stalled: ${instruction.stallReason || "Waiting for earlier stage"}`}
        </text>
      )}
    </g>
  );
};
