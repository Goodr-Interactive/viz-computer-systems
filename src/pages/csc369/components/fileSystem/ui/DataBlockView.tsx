import React from "react";
import { TitleWithTooltip } from "./TitleWithTooltip";
import { Badge } from "@/components/ui/badge";

interface DataBlockViewProps {
  blockIndex: number;
  content: string;
  correctBlock: number | null;
}

export const DataBlockView: React.FC<DataBlockViewProps> = ({
  blockIndex,
  content,
  correctBlock,
}) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-96 flex-col gap-3">
        <div className="flex">
          <TitleWithTooltip
            title={`Block Content (Block ${blockIndex})`}
            tooltipText="Data blocks store the actual content of a file."
            className="pt-2 text-start font-medium"
          />{" "}
          {correctBlock === blockIndex && (
            <Badge className="mt-2 ml-4 border-green-400 bg-green-100 py-1 pt-[3px] text-green-600">
              Correct Block
            </Badge>
          )}
        </div>
        <div
          className={`border-border rounded-md border p-4 font-mono text-sm whitespace-pre-wrap ${correctBlock === blockIndex ? "border-green-400 bg-green-50" : "border-border"}`}
        >
          {content}
        </div>
      </div>
    </div>
  );
};
