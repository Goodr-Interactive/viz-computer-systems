import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface InfoHeaderProps {
  children: React.ReactNode;
  value: string;
  definition: string;
  calculation: string;
}

export const InfoHeader: React.FC<InfoHeaderProps> = ({
  children,
  value,
  definition,
  calculation,
}) => (
  <div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-muted-foreground border-muted-foreground/50 hover:border-muted-foreground inline-block cursor-help border-b border-dotted text-sm font-medium transition-colors">
            {children}
          </p>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-3" side="top">
          <div className="space-y-2">
            <p className="text-sm font-medium">{definition}</p>
            <p className="text-xs text-gray-200">
              <strong>Calculation:</strong> {calculation}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <p className="font-medium">{value}</p>
  </div>
);
