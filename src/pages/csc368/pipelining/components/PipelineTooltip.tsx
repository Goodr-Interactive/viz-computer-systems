import React from "react";
import type { Instruction } from "./types";

interface PipelineTooltipProps {
  x: number;
  y: number;
  instructionName: string;
  stageName: string;
  timeLabel: string;
  endTimeLabel?: string;
  instruction?: Instruction;
  stageDuration?: number;
  svgWidth?: number;
  svgHeight?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export const PipelineTooltip: React.FC<PipelineTooltipProps> = ({
  x,
  y,
  instructionName,
  stageName,
  timeLabel,
  endTimeLabel,
  instruction,
  stageDuration,
  svgWidth = 800,
  svgHeight = 600,
  margin = { top: 50, right: 30, bottom: 50, left: 100 },
}) => {
  // Calculate additional height if we need to show stall information
  const baseHeight = 60;
  const progressHeight = instruction?.stageProgress && instruction?.stageProgress > 1 ? 20 : 0;
  const stallHeight = instruction?.stalled ? 20 : 0;
  const totalHeight = baseHeight + progressHeight + stallHeight;

  // Tooltip dimensions
  const tooltipWidth = 220;
  const tooltipHeight = totalHeight;

  // Calculate smart positioning to keep tooltip visible
  const getSmartPosition = () => {
    let adjustedX = x;
    let adjustedY = y;

    // Default offset to avoid covering the hovered element
    const defaultOffsetX = 10;
    const defaultOffsetY = -10;

    // Available space calculations (considering margins)
    const availableWidth = svgWidth - margin.left - margin.right;
    const availableHeight = svgHeight - margin.top - margin.bottom;

    // Check horizontal bounds
    if (x + defaultOffsetX + tooltipWidth > availableWidth) {
      // Tooltip would extend beyond right edge, position to the left
      adjustedX = x - tooltipWidth - defaultOffsetX;

      // If still outside bounds on the left, clamp to right edge
      if (adjustedX < 0) {
        adjustedX = availableWidth - tooltipWidth;
      }
    } else {
      // Use default right positioning
      adjustedX = x + defaultOffsetX;
    }

    // Check vertical bounds
    if (y + defaultOffsetY - tooltipHeight < 0) {
      // Tooltip would extend beyond top edge, position below
      adjustedY = y + Math.abs(defaultOffsetY) + 20; // Add some padding

      // If still outside bounds at bottom, clamp to top
      if (adjustedY + tooltipHeight > availableHeight) {
        adjustedY = availableHeight - tooltipHeight;
      }
    } else {
      // Use default top positioning
      adjustedY = y + defaultOffsetY;
    }

    // Ensure tooltip doesn't go beyond the available area
    adjustedX = Math.max(0, Math.min(adjustedX, availableWidth - tooltipWidth));
    adjustedY = Math.max(0, Math.min(adjustedY, availableHeight - tooltipHeight));

    return { x: adjustedX, y: adjustedY };
  };

  const { x: finalX, y: finalY } = getSmartPosition();

  return (
    <g className="tooltip" transform={`translate(${finalX}, ${finalY})`}>
      <rect
        fill="white"
        stroke="black"
        rx={5}
        ry={5}
        width={tooltipWidth}
        height={tooltipHeight}
        opacity={0.9}
      />
      <text x={10} y={20}>
        {`Instruction: ${instructionName}`}
      </text>
      <text x={10} y={40}>
        {`Stage: ${stageName} (${timeLabel}${endTimeLabel ? ` - ${endTimeLabel}` : ""})`}
      </text>

      {/* Show progress information for multi-cycle stages */}
      {instruction?.stageProgress && instruction?.stageProgress > 1 && (
        <text x={10} y={60} fill={instruction.stalled ? "red" : "black"}>
          {`Progress: ${instruction.stageProgress}/${stageDuration || instruction.stageDuration || "?"} cycles`}
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
