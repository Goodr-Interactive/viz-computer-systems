import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TitleWithTooltipProps {
  title: React.ReactNode;
  tooltipText: string;
  className?: string;
}

export const TitleWithTooltip: React.FC<TitleWithTooltipProps> = ({
  title,
  tooltipText,
  className,
}) => {
  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip delayDuration={350}>
          <TooltipTrigger asChild>
            <span className="border-muted-foreground/50 hover:border-muted-foreground cursor-help border-b border-dotted transition-colors">
              {title}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" sideOffset={4}>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
