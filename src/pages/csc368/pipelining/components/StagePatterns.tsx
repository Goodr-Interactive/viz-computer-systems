import React from "react";

interface StagePatternProps {
  stageImages: string[];
}

export const StagePatterns: React.FC<StagePatternProps> = ({ stageImages }) => {
  return (
    <defs>
      {stageImages.map((image, index) => (
        <pattern
          key={`stage-pattern-${index}`}
          id={`stage-pattern-${index}`}
          patternUnits="objectBoundingBox"
          width={1}
          height={1}
          patternContentUnits="objectBoundingBox"
        >
          <image
            href={image}
            width={1}
            height={1}
            preserveAspectRatio="xMidYMid meet"
          />
        </pattern>
      ))}
    </defs>
  );
};
