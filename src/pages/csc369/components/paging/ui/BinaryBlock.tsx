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
                "flex h-8 w-8 items-center justify-center border-y border-l transition-colors",
                // Add right border for the last element
                index === blocks - 1 && "border-r",
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
  isPadding?: boolean[]; // Array indicating which bits are padding 0s
  showBitNumbers?: boolean;
  startBitNumber?: number;
  label?: string;
  className?: string;
}

export const MultiColorBinaryBlock: React.FC<MultiColorBinaryBlockProps> = ({
  blocks,
  digits,
  colors,
  borderColors,
  hoverColors,
  isPadding = [],
  showBitNumbers = false,
  startBitNumber = 0,
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
        {blockArray.map((index) => {
          const isBlockPadding = isPadding[index] || false;

          return (
            <div key={index}>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center border-y border-l",
                  // Always show left border, and add right border for the last element
                  index === blocks - 1 && "border-r",
                  // Use table styling for padding bits, normal colors for data bits
                  isBlockPadding ? "bg-muted/50" : colors[index] || "bg-gray-100",
                  // Each box controls its own left border color
                  isBlockPadding ? "border-border" : borderColors[index] || "border-gray-300",
                  // Add hover effect and transition for non-padding bits
                  !isBlockPadding && "transition-colors",
                  !isBlockPadding && (hoverColors[index] || "group-hover:bg-gray-200")
                )}
                aria-label={`Block ${index}`}
              >
                {digits && digits[index] !== undefined && (
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      // Muted text color for padding 0s, normal color for data bits
                      isBlockPadding ? "text-muted-foreground" : "text-gray-800"
                    )}
                  >
                    {digits[index]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {label && <div className="text-muted-foreground mt-2 text-center text-sm">{label}</div>}
    </div>
  );
};
