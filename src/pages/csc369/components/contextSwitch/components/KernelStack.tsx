import React from "react";
import type { KernelStack } from "../types";
import { TableCell } from "./TableCell";
import type { Copy } from "../hooks";
import { getKernelStackDescription } from "../utils";

interface Props {
  name: string;
  kstack: KernelStack;
  checkpoint: KernelStack;
  copy?: Copy;
  copyField: (field: string, value: string | number) => void;
  pasteField: (field: keyof KernelStack, value: string) => void;
}

export const KernelStackDisplay: React.FunctionComponent<Props> = ({ name, kstack, checkpoint, copy, copyField, pasteField }) => {
  const rows = Object.entries(kstack) as Array<[keyof KernelStack, KernelStack[keyof KernelStack]]>;

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{name}</span>
      <div className="flex flex-col">
        {rows.map(([field, value]) => (
          <TableCell 
            field={field}
            value={value}
            error={undefined}
            onClick={() => copy ? pasteField(field, `${copy.value}`) : copyField(field, value)}
            copied={
              copy?.context === name && copy.field === field
            }
            modified={kstack[field] !== checkpoint[field]}
            tooltip={getKernelStackDescription(field)}
          />
        ))}
      </div>
    </div>
  );
};
