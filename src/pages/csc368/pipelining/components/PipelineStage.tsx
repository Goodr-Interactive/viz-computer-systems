import React from "react";
import type { Instruction } from "./types";

interface PipelineStageProps {
  instruction: Instruction;
  stage: number;
  stageName: string;
  cycle: number;
  xPos: number;
  yPos: number;
  width: number;
  height: number;
  timeLabel: string;
  stageImage: string;
  onMouseEnter: (event: React.MouseEvent, instruction: Instruction, stageName: string, timeLabel: string) => void;
  onMouseLeave: () => void;
  isSuperscalarActive?: boolean;
  parallelInstructions?: Instruction[];
  isFirstInGroup?: boolean;
  color?: string; // Add color prop
  abbreviation?: string; // Add abbreviation prop
}

export const PipelineStage: React.FC<PipelineStageProps> = ({
  instruction,
  stage,
  stageName,
  cycle,
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
}) => {
  // Calculate inner rectangle size for the icon (slightly smaller)
  const innerWidth = width * 0.8;
  const innerHeight = height * 0.8;
  const innerX = (width - innerWidth) / 2;
  const innerY = (height - innerHeight) / 2;

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
        width={width}
        height={height}
        fill={instruction.stalled && stage === instruction.currentStage 
          ? "#f8d7da" 
          : color || instruction.color}
        stroke="black"
        rx={4}
      />

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
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color || instruction.color}
            fontSize="16px"
            fontWeight="bold"
          >
            {abbreviation}
          </text>
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
            fontSize="10px"
            fontWeight="bold"
          >
            {parallelInstructions.length}x
          </text>
        </g>
      )}
    </g>
  );
};
