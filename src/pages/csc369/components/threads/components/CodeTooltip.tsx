import React, { type PropsWithChildren } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  code: string;
}

export const CodeTooltip: React.FunctionComponent<PropsWithChildren<Props>> = ({
  code,
  children,
}) => {
  return (
    <Tooltip>
      <TooltipContent>
        <p style={{ whiteSpace: "pre-wrap", fontFamily: "Courier New" }}>{code}</p>
      </TooltipContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
    </Tooltip>
  );
};
