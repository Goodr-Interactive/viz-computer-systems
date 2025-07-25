import React from "react";
import type { Instruction } from "./types";

interface PipelineStageProps {
  instruction: Instruction;
  stage: number;
  stageName: string;
  cycle: number;
  cycleLength?: number;
  xPos: number;
  yPos: number;
  width: number;
  height: number;
  timeLabel: string;
  stageImage: string;
  onMouseEnter: (
    event: React.MouseEvent,
    instruction: Instruction,
    stageName: string,
    timeLabel: string
  ) => void;
  onMouseLeave: () => void;
  isSuperscalarActive?: boolean;
  parallelInstructions?: Instruction[];
  isFirstInGroup?: boolean;
  color?: string; // Add color prop
  abbreviation?: string; // Add abbreviation prop
  compact?: boolean; // Add compact prop
}

export const PipelineStage: React.FC<PipelineStageProps> = ({
  instruction,
  stage,
  stageName,
  cycle,
  cycleLength,
  xPos,
  yPos,
  width,
  height,
  timeLabel,
  stageImage,
  onMouseEnter,
  onMouseLeave,
  isSuperscalarActive = false,
  parallelInstructions = [],
  isFirstInGroup = false,
  color, // Add color prop
  abbreviation, // Add abbreviation prop
  compact = false, // Add compact prop with default false
}) => {
  const displayableCycleLength = cycleLength || 1;
  const actualWidth = width * displayableCycleLength; // Calculate the true width for the stage

  // Calculate inner rectangle size for the icon (slightly smaller, based on single cycle width)
  const innerWidth = width * 0.8;
  const innerHeight = height * 0.8;
  const innerX = (width - innerWidth) / 2;
  const innerY = (height - innerHeight) / 2;

  // Font sizes based on compact mode
  const stageFontSize = compact ? "12px" : "16px";
  const progressFontSize = compact ? "10px" : "12px";
  const superscalarFontSize = compact ? "8px" : "10px";

  return (
    <g
      transform={`translate(${xPos}, ${yPos})`}
      opacity={0.7}
      onMouseEnter={(e) => onMouseEnter(e, instruction, stageName, timeLabel)}
      onMouseLeave={onMouseLeave}
      className="pipeline-stage"
    >
      {/* Background Rectangle */}
      <rect
        width={actualWidth} // Use the calculated actualWidth
        height={height}
        fill={instruction.stalled ? "#f8d7da" : color || instruction.color}
        stroke={instruction.stalled ? "red" : "black"}
        strokeWidth={instruction.stalled ? 2 : 1}
        rx={4}
      />

      {/* Stall indicator - diagonal lines pattern */}
      {instruction.stalled && (
        <pattern
          id={`stall-pattern-${instruction.id}-${stage}-${cycle}`}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="red" strokeWidth="2" />
        </pattern>
      )}

      {instruction.stalled && (
        <rect
          width={actualWidth} // Use the calculated actualWidth
          height={height}
          fill={`url(#stall-pattern-${instruction.id}-${stage}-${cycle})`}
          rx={4}
          opacity={0.3}
        />
      )}

      {/* Stage Icon or Abbreviation */}
      {stageImage ? (
        <rect
          width={innerWidth}
          height={innerHeight}
          x={innerX}
          y={innerY}
          fill={`url(#stage-pattern-${stage})`}
          stroke="white"
          strokeWidth={1}
          rx={4}
        />
      ) : abbreviation ? (
        <g>
          <rect
            width={innerWidth}
            height={innerHeight}
            x={innerX}
            y={innerY}
            fill="white"
            stroke="white"
            strokeWidth={1}
            rx={4}
            opacity={0.9}
          />
          <text
            x={width / 2}
            y={height / 2 - (instruction.stageDuration && instruction.stageDuration > 1 ? 8 : 0)} // Adjust y based on if progress is shown
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color || instruction.color}
            fontSize={stageFontSize}
            fontWeight="bold"
          >
            {abbreviation}
          </text>

          {/* Show progress indicator for multi-cycle stages */}
          {instruction.stageDuration &&
            instruction.stageDuration > 1 &&
            instruction.stageProgress && (
              <text
                x={width / 2}
                y={height / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color || instruction.color}
                fontSize={progressFontSize}
                fontWeight="bold"
              >
                {`${instruction.stageProgress}/${instruction.stageDuration || "?"}`}
              </text>
            )}
        </g>
      ) : null}

      {/* Tint Overlay */}
      <rect
        width={innerWidth}
        height={innerHeight}
        x={innerX}
        y={innerY}
        fill={color || instruction.color}
        opacity={0.2}
        rx={4}
      />

      {/* Superscalar Badge - only on first stage */}
      {isSuperscalarActive && stage === 0 && parallelInstructions.length > 1 && isFirstInGroup && (
        <g transform={`translate(${width - 20}, 5)`}>
          <circle r={10} fill="#9333ea" stroke="white" strokeWidth={1} />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={superscalarFontSize}
            fontWeight="bold"
          >
            {parallelInstructions.length}x
          </text>
        </g>
      )}
    </g>
  );
};
