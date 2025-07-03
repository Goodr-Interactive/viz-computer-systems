import React from "react";
import { TitleWithTooltip } from "../TitleWithTooltip";

interface DataBlockViewProps {
  blockIndex: number;
  content: string;
}

export const DataBlockView: React.FC<DataBlockViewProps> = ({ blockIndex, content }) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-96 flex-col gap-3">
        <TitleWithTooltip
          title={`Block Content (Block ${blockIndex})`}
          tooltipText="Data blocks store the actual content of a file."
          className="pt-2 text-start font-medium"
        />
        <div className="border-border rounded-md border p-4 font-mono text-sm whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};
