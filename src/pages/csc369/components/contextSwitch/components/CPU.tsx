import React from "react";
import type { ContextSwitchController } from "../hooks";
import { TableCell } from "./TableCell";
import { type CPU as CPUContext } from "../types";
import { getCPUDescription } from "../utils";

interface Props {
  controller: ContextSwitchController;
}

export const CPU: React.FunctionComponent<Props> = ({ controller }) => {
  const rows = Object.entries(controller.CPU) as Array<[keyof CPUContext, string | number]>;

  const pointerAndFlags = rows.filter(([field]) => ["EFLAGS", "EIP", "ESP"].includes(field));
  const generalPurpose = rows.filter(([field]) =>
    ["EDI", "EBX", "ESI", "ECX", "EBP", "EDX"].includes(field)
  );

  const segments = rows.filter(([field]) => ["CS", "DS", "SS", "ES", "FS", "GS"].includes(field));

  return (
    <div className="border-border flex h-[475px] w-[475px] flex-col gap-[12px] rounded-md border p-[12px]">
      <h1 className="text-xl font-medium tracking-tight text-gray-800">CPU</h1>
      <div className="flex h-[350px] w-full flex-wrap items-center justify-center gap-[24px]">
        <div className="flex flex-col">
          <span className="text-sm text-gray-800">Instruction Pointer, Stack pointer,<br /> and Status Flags</span>
          <div className="flex w-[180px] flex-col">
            {pointerAndFlags.map(([field, value]) => (
              <TableCell
                field={field}
                value={value}
                error={controller.errors["cpu"]?.[field]}
                onClick={() =>
                  controller.copy
                    ? controller.setCPUField(field, controller.copy.value as string)
                    : controller.copyField("cpu", field, value)
                }
                copied={controller.copy?.context === "cpu" && controller.copy?.field === field}
                modified={controller.checkpoint.CPU[field] !== controller.CPU[field]}
                tooltip={getCPUDescription(field)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-800">Segment Registers</span>
          <div className="flex w-[180px] flex-col">
            {segments.map(([field, value]) => (
              <TableCell
                field={field}
                value={value}
                error={controller.errors["cpu"]?.[field]}
                onClick={() =>
                  controller.copy
                    ? controller.setCPUField(field, controller.copy.value as string)
                    : controller.copyField("cpu", field, value)
                }
                copied={controller.copy?.context === "cpu" && controller.copy?.field === field}
                modified={controller.checkpoint.CPU[field] !== controller.CPU[field]}
                tooltip={getCPUDescription(field)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-800">General Purpose Registers</span>
          <div className="flex w-[180px] flex-col">
            {generalPurpose.map(([field, value]) => (
              <TableCell
                field={field}
                value={value}
                error={controller.errors["cpu"]?.[field]}
                onClick={() =>
                  controller.copy
                    ? controller.setCPUField(field, controller.copy.value as string)
                    : controller.copyField("cpu", field, value)
                }
                copied={controller.copy?.context === "cpu" && controller.copy?.field === field}
                modified={controller.checkpoint.CPU[field] !== controller.CPU[field]}
                tooltip={getCPUDescription(field)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
