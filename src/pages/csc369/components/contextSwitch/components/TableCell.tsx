import React from "react";
import tailwindcolors from "tailwindcss/colors";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  error?: boolean;
  copied?: boolean;
  modified?: boolean;
  field: string;
  value: string | number;
  onClick?: () => void;
  tooltip: string;
}

export const TableCell: React.FunctionComponent<Props> = ({
  error,
  copied,
  modified,
  field,
  value,
  onClick,
  tooltip,
}) => {
  const [borderColor, backgroundColor, color] = (() => {
    const color = copied ? "green" : error ? "red" : modified ? "yellow" : "gray";

    return [tailwindcolors[color][300], tailwindcolors[color][100], tailwindcolors[color][800]];
  })();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex w-full"
          onClick={onClick}
          style={{ cursor: onClick ? "pointer" : undefined }}
        >
          <div
            className="border-border flex w-full justify-start p-[4px]"
            style={{ borderWidth: "1px", borderColor, backgroundColor, color, fontSize: "10px" }}
          >
            {field}
          </div>
          <div
            className="border-border flex w-full justify-start p-[4px]"
            style={{ borderWidth: "1px", borderColor, backgroundColor, color, fontSize: "10px" }}
          >
            {value}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
