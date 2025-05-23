import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BinaryBlockProps } from "./types";

export const BinaryBlock: React.FC<BinaryBlockProps> = ({
  blocks,
  color = "bg-primary/80",
  borderColor = "border-border",
  hoverColor = "group-hover:bg-primary",
  tooltip,
  showLeftBorder = false,
  label,
  startBitNumber = 0,
  showBitNumbers = true,
  className,
  onClick,
}) => {
  const blockArray = Array.from({ length: blocks }, (_, i) => i);

  const blockContent = (
    <div className="flex flex-col items-center">
      {showBitNumbers && (
        <div className="mb-1 flex w-full items-center justify-center">
          {blockArray.map((index) => (
            <div key={`bit-${index}`} className="w-8 text-center">
              <span className="text-muted-foreground text-xs">
                {startBitNumber + (blocks - 1 - index)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          "group flex cursor-pointer flex-wrap rounded-md transition-colors",
          className
        )}
        onClick={onClick}
        aria-label={`Binary block group with ${blocks} blocks`}
      >
        {blockArray.map((index) => (
          <div key={index}>
            <div
              className={cn(
                "h-8 w-8 border-y border-r transition-colors",
                index === 0 && showLeftBorder && "border-l",
                color,
                borderColor,
                hoverColor
              )}
              aria-label={`Block ${index}`}
            />
          </div>
        ))}
      </div>
      {label && <div className="text-muted-foreground mt-2 text-center text-sm">{label}</div>}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{blockContent}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return blockContent;
};
