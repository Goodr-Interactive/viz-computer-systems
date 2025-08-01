import React, { useState, useEffect } from "react";
import { BinaryBlock } from "../../paging/ui/BinaryBlock";
import { SubsectionHeading } from "../../paging/ui/SubsectionHeading";
import { AccessSequenceEditor } from "./AccessSequenceEditor";

interface AccessSequenceDisplayProps {
  accessSequence: Array<string | number>;
  currentStep: number;
  maxStep: number;
  onStepClick?: (step: number) => void;
  isEditing?: boolean;
  onSequenceChange?: (newSequence: Array<string | number>) => void;
  shouldSaveChanges?: boolean;
  onSaveComplete?: () => void;
}

export const AccessSequenceDisplay: React.FC<AccessSequenceDisplayProps> = ({
  accessSequence,
  currentStep,
  onStepClick,
  isEditing = false,
  onSequenceChange,
  shouldSaveChanges = false,
  onSaveComplete,
}) => {
  const [localSequence, setLocalSequence] = useState<Array<string | number>>(accessSequence);

  // Update local sequence when the prop changes
  useEffect(() => {
    setLocalSequence(accessSequence);
  }, [accessSequence]);

  // Save changes when requested
  useEffect(() => {
    if (shouldSaveChanges && onSequenceChange) {
      // Filter out empty values and revert them to original values
      const filteredSequence = localSequence.map((value, index) => {
        // If value is empty or just whitespace, revert to original
        if (typeof value === "string" && value.trim() === "") {
          return accessSequence[index] || "";
        }
        return value;
      });

      onSequenceChange(filteredSequence);
      onSaveComplete?.();
    }
  }, [shouldSaveChanges, localSequence, onSequenceChange, onSaveComplete, accessSequence]);

  return (
    <section className="w-full max-w-7xl overflow-x-auto">
      <div className="bg-muted/50 min-w-fit rounded-lg p-6">
        <SubsectionHeading>Page Accesses</SubsectionHeading>

        <div className="mt-6 space-y-4">
          {/* Access Sequence Blocks */}
          <div className="flex flex-wrap items-center gap-3">
            {isEditing ? (
              <AccessSequenceEditor sequence={localSequence} onChange={setLocalSequence} />
            ) : (
              accessSequence.map((value, index) => {
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
                  hoverColor = "group-hover:bg-gray-100 group-hover:border-gray-300";
                }

                const handleClick = () => {
                  if (onStepClick && !isCurrentStep) {
                    onStepClick(index);
                  }
                };

                return (
                  <div key={index} className="flex flex-col items-center">
                    <BinaryBlock
                      blocks={1}
                      digits={[String(value)]}
                      color={color}
                      borderColor={borderColor}
                      hoverColor={hoverColor}
                      showBitNumbers={false}
                      className={`transition-all duration-200 ${
                        !isCurrentStep && onStepClick ? "cursor-pointer" : ""
                      }`}
                      label={`${index + 1}`}
                      onClick={handleClick}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
