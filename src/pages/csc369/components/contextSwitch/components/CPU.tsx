import React from "react";
import type { ContextSwitchController } from "../hooks";
import { TableCell } from "./TableCell";
import { type CPU as CPUContext } from "../types"

interface Props {
  controller: ContextSwitchController;
}

export const CPU: React.FunctionComponent<Props> = ({ controller }) => {
  const rows = Object.entries(controller.CPU) as Array<[keyof CPUContext, string | number]>;

  return (
    <div className="border-border flex h-[300px] w-[300px] flex-col gap-[12px] rounded-md border p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">CPU</h1>

      <div className="flex flex-col items-center gap-[24px]">
        <div className="flex w-[180px] flex-col">
          {rows.map(([field, value]) => (
            <TableCell
              field={field}
              value={value}
              onClick={() => controller.copyField("cpu", field, value)}
              copied={controller.copy?.context === "cpu" && controller.copy?.field === field}
              modified={controller.checkpoint.CPU[field] !== controller.CPU[field]}
              tooltip=""
            />
          ))}
        </div>
        <div></div>
      </div>
    </div>
  );
};
