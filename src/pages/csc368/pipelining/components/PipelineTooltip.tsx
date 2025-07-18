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
  // Text wrapping utility
  const wrapText = (text: string, maxWidth: number, fontSize = 12) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Approximate character width based on font size
    const charWidth = fontSize * 0.6;
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
          // Word is too long, check if it contains parentheses for time ranges
          if (word.includes('(') && word.includes(')')) {
            // Try to split at parentheses for better readability
            const parts = word.split('(');
            if (parts.length === 2) {
              lines.push(parts[0].trim());
              lines.push(`(${parts[1]}`);
            } else {
              lines.push(word);
            }
          } else {
            lines.push(word);
          }
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Calculate additional height if we need to show stall information
  const baseHeight = 60;
  const progressHeight = instruction?.stageProgress && instruction?.stageProgress > 1 ? 20 : 0;
  const stallHeight = instruction?.stalled ? 20 : 0;
  
  // Calculate extra height for wrapped text
  const stageText = `Stage: ${stageName} (${timeLabel}${endTimeLabel ? ` - ${endTimeLabel}` : ""})`;
  const stageTextLines = wrapText(stageText, 300);
  const extraTextHeight = Math.max(0, (stageTextLines.length - 1) * 18);
  
  const totalHeight = baseHeight + progressHeight + stallHeight + extraTextHeight;

  // Tooltip dimensions - make wider to accommodate longer text
  const tooltipWidth = 260;
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
      
      {/* Render wrapped stage text */}
      {stageTextLines.map((line, index) => (
        <text key={index} x={10} y={40 + index * 18}>
          {line}
        </text>
      ))}

      {/* Show progress information for multi-cycle stages */}
      {instruction?.stageProgress && instruction?.stageProgress > 1 && (
        <text x={10} y={40 + stageTextLines.length * 18 + 20} fill={instruction.stalled ? "red" : "black"}>
          {`Progress: ${instruction.stageProgress}/${stageDuration || instruction.stageDuration || "?"} cycles`}
        </text>
      )}

      {/* Show stall information if the instruction is stalled */}
      {instruction?.stalled && (
        <text x={10} y={40 + stageTextLines.length * 18 + 20 + progressHeight} fill="red">
          {`Stalled: ${instruction.stallReason || "Waiting for earlier stage"}`}
        </text>
      )}
    </g>
  );
};
