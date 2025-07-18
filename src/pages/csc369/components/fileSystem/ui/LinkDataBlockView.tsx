import React from "react";
import { TitleWithTooltip } from "./TitleWithTooltip";

interface EnhancedDataBlockViewProps {
  blockIndex: number;
  content: string;
  isHighlighted?: boolean;
}

export const EnhancedDataBlockView: React.FC<EnhancedDataBlockViewProps> = ({
  blockIndex,
  content,
  isHighlighted = false,
}) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-96 flex-col gap-3">
        <TitleWithTooltip
          title={`Block Content (Block ${blockIndex})`}
          tooltipText="Data blocks store the actual content of a file."
          className="pt-2 text-start font-medium"
        />
        <div
          className={`rounded-md border p-4 font-mono text-sm whitespace-pre-wrap ${
            isHighlighted ? "border-orange-400 bg-orange-50" : "border-border"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
};
