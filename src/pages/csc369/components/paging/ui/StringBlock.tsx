import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StringBlockProps {
  /**
   * The string or number value to display
   */
  value: string | number;
  /**
   * Background color for the block
   */
  color?: string;
  /**
   * Border color for the block
   */
  borderColor?: string;
  /**
   * Hover color class for the block (full Tailwind class name)
   */
  hoverColor?: string;
  /**
   * Tooltip content to display on hover
   */
  tooltip?: React.ReactNode;
  /**
   * Show left border on the block
   */
  showLeftBorder?: boolean;
  /**
   * Label to display below the block
   */
  label?: React.ReactNode;
  /**
   * Optional class name for styling the outer div
   */
  className?: string;
  /**
   * Optional class name for styling the block itself
   * Can be used to override or add to the default w-32 width.
   */
  blockClassName?: string;
  /**
   * Optional click handler for the block
   */
  onClick?: () => void;
}

export const StringBlock: React.FC<StringBlockProps> = ({
  value,
  color = "bg-primary/80",
  borderColor = "border-border",
  hoverColor = "group-hover:bg-primary",
  tooltip,
  showLeftBorder = false,
  label,
  className,
  blockClassName,
  onClick,
}) => {
  const blockContent = (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn("group flex flex-wrap rounded-md transition-colors")}
        onClick={onClick}
        aria-label={`String block displaying ${value}`}
      >
        <div
          className={cn(
            "flex h-8 min-w-16 items-center justify-center border-y border-r px-3 py-1 transition-colors",
            showLeftBorder && "border-l",
            color,
            borderColor,
            hoverColor,
            blockClassName
          )}
          aria-label={`Value: ${value}`}
        >
          <span className="truncate font-mono text-sm font-medium text-gray-800">{value}</span>
        </div>
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
