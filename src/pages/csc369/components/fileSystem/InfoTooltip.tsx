import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  label: string;
  value: string | number;
  tooltipText: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, value, tooltipText }) => {
  return (
    <div className="flex justify-between">
      <TooltipProvider>
        <Tooltip delayDuration={350}>
          <TooltipTrigger asChild>
            <span className="border-muted-foreground/50 hover:border-muted-foreground cursor-help border-b border-dotted font-medium transition-colors">
              {label}:
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span>{value}</span>
    </div>
  );
};
