import React from "react";
import type { Context } from "../types";
import type { ContextSwitchController, Section } from "../hooks";
import { TableCell } from "./TableCell";
import { getContextDescription } from "../utils";

interface Props {
  name: string;
  section: Section;
  context: Context;
  checkpoint: Context;
  controller: ContextSwitchController;
  errors?: Record<string, boolean>;
  updateField: (field: keyof Context, value: Context[keyof Context]) => void;
}

export const ContextTable: React.FunctionComponent<Props> = ({
  name,
  section,
  controller,
  errors,
  context,
  checkpoint,
  updateField,
}) => {
  const contextFields = Object.entries(context) as Array<[keyof Context, string]>;
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-800">{name}</span>
      <div className="flex w-[180px] flex-col">
        {contextFields.map(([field, value]) => (
          <TableCell
            field={field}
            value={value}
            tooltip={getContextDescription(field)}
            modified={checkpoint[field] !== value}
            copied={controller.copy?.context === section && controller.copy.field === field}
            error={errors?.[field]}
            onClick={() =>
              controller.copy
                ? updateField(field, `${controller.copy.value}`)
                : controller.copyField(section, field, value)
            }
          />
        ))}
      </div>
    </div>
  );
};
