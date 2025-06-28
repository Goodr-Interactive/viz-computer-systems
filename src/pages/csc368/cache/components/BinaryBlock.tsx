import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface BinaryBlockProps {
  /**
   * Number of blocks to render
   */
  blocks: number;
  /**
   * Background color for the blocks
   */
  color?: string;
  /**
   * Border color for the blocks
   */
  borderColor?: string;
  /**
   * Hover color class for blocks (full Tailwind class name)
   */
  hoverColor?: string;
  /**
   * Tooltip content to display on hover
   */
  tooltip?: React.ReactNode;
  /**
   * Show left border on the first block
   */
  showLeftBorder?: boolean;
  /**
   * Label to display below the blocks
   */
  label?: React.ReactNode;
  /**
   * Starting bit number (for continuous numbering across multiple blocks)
   */
  startBitNumber?: number;
  /**
   * Whether to show bit numbers
   */
  showBitNumbers?: boolean;
  /**
   * Optional class name for styling
   */
  className?: string;
  /**
   * Optional click handler for the entire block group
   */
  onClick?: () => void;
  /**
   * Binary string to display inside the blocks (one character per block)
   */
  binaryValue?: string;
}

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
  binaryValue,
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
              {binaryValue && (
                <span className="font-mono text-xs font-semibold">{binaryValue[index] || "0"}</span>
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
