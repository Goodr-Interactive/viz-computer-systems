import React from "react";
import type { KernelStack } from "../types";
import { TableCell } from "./TableCell";
import type { Copy, Section } from "../hooks";
import { getKernelStackDescription } from "../utils";
import { EllipsesCell } from "./EllipsesCell";

interface Props {
  name: string;
  section: Section;
  kstack: KernelStack;
  checkpoint: KernelStack;
  copy?: Copy;
  errors?: Record<string, boolean>;
  copyField: (field: string, value: string | number) => void;
  pasteField: (field: keyof KernelStack, value: string) => void;
}

export const KernelStackDisplay: React.FunctionComponent<Props> = ({
  name,
  section,
  kstack,
  checkpoint,
  copy,
  errors,
  copyField,
  pasteField,
}) => {
  const rows = Object.entries(kstack) as Array<[keyof KernelStack, KernelStack[keyof KernelStack]]>;

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-800">{name}</span>
      <div className="flex flex-col">
        {rows.map(([field, value]) => (
          <TableCell
            field={field}
            value={value}
            error={errors?.[field]}
            onClick={() =>
              copy ? pasteField(field, `${copy.value}`) : value !== "" && copyField(field, value)
            }
            copied={copy?.context === section && copy.field === field}
            modified={kstack[field] !== checkpoint[field]}
            tooltip={getKernelStackDescription(field)}
          />
        ))}
        <EllipsesCell />
      </div>
    </div>
  );
};
