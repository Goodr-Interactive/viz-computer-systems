import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BinaryBlockProps } from "../types";

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
  digits,
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
                "flex h-8 w-8 items-center justify-center border-y border-r transition-colors",
                index === 0 && showLeftBorder && "border-l",
                color,
                borderColor,
                hoverColor
              )}
              aria-label={`Block ${index}`}
            >
              {digits && digits[index] !== undefined && (
                <span className="font-mono text-sm font-medium text-gray-800">{digits[index]}</span>
              )}
            </div>
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

// New variant for multi-colored blocks (for hex hint spanning PFN/Offset boundary)
interface MultiColorBinaryBlockProps {
  blocks: number;
  digits: string[];
  colors: string[]; // Array of colors, one for each block
  borderColors: string[]; // Array of border colors, one for each block
  hoverColors: string[]; // Array of hover colors, one for each block
  showBitNumbers?: boolean;
  startBitNumber?: number;
  showLeftBorder?: boolean;
  label?: string;
  className?: string;
}

export const MultiColorBinaryBlock: React.FC<MultiColorBinaryBlockProps> = ({
  blocks,
  digits,
  colors,
  borderColors,
  hoverColors,
  showBitNumbers = false,
  startBitNumber = 0,
  showLeftBorder = false,
  label,
  className,
}) => {
  const blockArray = Array.from({ length: blocks }, (_, i) => i);

  return (
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
        aria-label={`Multi-color binary block group with ${blocks} blocks`}
      >
        {blockArray.map((index) => (
          <div key={index}>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center border-y border-r transition-colors",
                index === 0 && showLeftBorder && "border-l",
                colors[index] || "bg-gray-100",
                borderColors[index] || "border-gray-300",
                hoverColors[index] || "group-hover:bg-gray-200"
              )}
              aria-label={`Block ${index}`}
            >
              {digits && digits[index] !== undefined && (
                <span className="font-mono text-sm font-medium text-gray-800">{digits[index]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {label && <div className="text-muted-foreground mt-2 text-center text-sm">{label}</div>}
    </div>
  );
};
