import React from "react";
import { BinaryBlock } from "../../paging/ui/BinaryBlock";
import { SubsectionHeading } from "../../paging/ui/SubsectionHeading";

interface AccessSequenceDisplayProps {
  accessSequence: (string | number)[];
  currentStep: number;
  maxStep: number;
}

export const AccessSequenceDisplay: React.FC<AccessSequenceDisplayProps> = ({
  accessSequence,
  currentStep,
  maxStep,
}) => {
  return (
    <section className="w-full max-w-7xl overflow-x-auto">
      <div className="bg-muted/50 min-w-fit rounded-lg p-6">
        <SubsectionHeading>Access Sequence</SubsectionHeading>
        
        <div className="mt-6 space-y-4">

          {/* Access Sequence Blocks */}
          <div className="flex flex-wrap items-center gap-3">
            {accessSequence.map((value, index) => {
              const isCurrentStep = index === currentStep;
              const isPastStep = index < currentStep;
              const isFutureStep = index > currentStep;

              let color = "bg-background";
              let borderColor = "border-border";
              let hoverColor = "group-hover:bg-primary/20";

              if (isCurrentStep) {
                color = "bg-blue-100";
                borderColor = "border-blue-300";
                hoverColor = "group-hover:bg-blue-200";
              } else if (isPastStep) {
                color = "bg-gray-100";
                borderColor = "border-gray-300";
                hoverColor = "group-hover:bg-gray-200";
              } else if (isFutureStep) {
                color = "bg-background";
                borderColor = "border-border";
                hoverColor = "group-hover:bg-primary/20";
              }

              return (
                <div key={index} className="flex flex-col items-center">
                  <BinaryBlock
                    blocks={1}
                    digits={[String(value)]}
                    color={color}
                    borderColor={borderColor}
                    hoverColor={hoverColor}
                    showBitNumbers={false}
                    tooltip={`Step ${index + 1}: Access ${value}`}
                    className="transition-all duration-200"
                    label={`${index + 1}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}; 