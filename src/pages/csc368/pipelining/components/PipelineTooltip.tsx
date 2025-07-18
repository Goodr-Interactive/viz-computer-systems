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
  // Helper function to wrap text for SVG
  const wrapText = (text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Approximate character width for Arial font at 14px (larger font)
    const charWidth = 8.5;
    const maxChars = Math.floor(maxWidth / charWidth);
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word is too long, split it
          lines.push(word);
          currentLine = '';
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Create wrapped text for the stage info
  const taskText = `Task: ${instructionName}`;
  const stageText = endTimeLabel 
    ? `Stage: ${stageName} (${timeLabel} to ${endTimeLabel})`
    : `Stage: ${stageName} (${timeLabel})`;
  
  const taskLines = wrapText(taskText, 300); // Increased max width for wrapping
  const stageLines = wrapText(stageText, 300); // Increased max width for wrapping
  
  // Calculate dynamic height based on text lines
  const lineHeight = 18; // Increased line height for larger font
  const baseHeight = (taskLines.length + stageLines.length) * lineHeight + 24; // More padding
  const progressHeight = instruction?.stageProgress && instruction?.stageProgress > 1 ? 22 : 0;
  const stallHeight = instruction?.stalled ? 22 : 0;
  const totalHeight = baseHeight + progressHeight + stallHeight;

  // Tooltip dimensions - make it even wider to accommodate longer text
  const tooltipWidth = 320;
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
      
      {/* Render wrapped task text */}
      {taskLines.map((line, index) => (
        <text 
          key={`task-${index}`} 
          x={12} 
          y={22 + index * lineHeight}
          fontSize={14}
          fontFamily="Arial, sans-serif"
          fontWeight="500"
        >
          {line}
        </text>
      ))}
      
      {/* Render wrapped stage text */}
      {stageLines.map((line, index) => (
        <text 
          key={`stage-${index}`} 
          x={12} 
          y={22 + taskLines.length * lineHeight + index * lineHeight}
          fontSize={14}
          fontFamily="Arial, sans-serif"
        >
          {line}
        </text>
      ))}

      {/* Show progress information for multi-cycle stages */}
      {instruction?.stageProgress && instruction?.stageProgress > 1 && (
        <text 
          x={12} 
          y={22 + (taskLines.length + stageLines.length) * lineHeight + 12}
          fill={instruction.stalled ? "red" : "black"}
          fontSize={14}
          fontFamily="Arial, sans-serif"
        >
          {`Progress: ${instruction.stageProgress}/${stageDuration || instruction.stageDuration || "?"} cycles`}
        </text>
      )}

      {/* Show stall information if the instruction is stalled */}
      {instruction?.stalled && (
        <text 
          x={12} 
          y={22 + (taskLines.length + stageLines.length) * lineHeight + 12 + progressHeight}
          fill="red"
          fontSize={14}
          fontFamily="Arial, sans-serif"
        >
          {`Stalled: ${instruction.stallReason || "Waiting for earlier stage"}`}
        </text>
      )}
    </g>
  );
};
