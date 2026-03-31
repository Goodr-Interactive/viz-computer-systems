import React, { useState, type PropsWithChildren } from "react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { TableCell } from "./TableCell";

interface Props {
  field: string;
  value: string;
  tooltip: string;
  error?: boolean;
  modified?: boolean;
}

export const PopoverCell: React.FunctionComponent<PropsWithChildren<Props>> = ({
  field,
  value,
  tooltip,
  error,
  modified,
  children,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover open={open}>
      <PopoverTrigger className="flex justify-start">
        <TableCell
          onClick={() => setOpen((o) => !o)}
          field={field}
          value={value}
          tooltip={tooltip}
          error={error}
          modified={modified}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-[8px]">{children}</PopoverContent>
    </Popover>
  );
};
