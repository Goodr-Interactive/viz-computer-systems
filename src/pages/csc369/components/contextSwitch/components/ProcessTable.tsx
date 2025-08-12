import React from "react";
import { TableCell } from "./TableCell";
import { EllipsesCell } from "./EllipsesCell";
import { ProcessState, type Process } from "../types";
import { getProcessDescription } from "../utils";
import { PopoverCell } from "./PopoverCell";
import { Button } from "../../../../../components/ui/button";

interface Props {
  name: string;
  process: Process;
  checkpoint: Process;
  errors?: Record<string, boolean>;
  setState: (state: ProcessState) => void;
}

export const ProcessTable: React.FunctionComponent<Props> = ({
  name,
  process,
  checkpoint,
  errors,
  setState,
}) => {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-800">{name}</span>
      <div className="flex w-[180px] flex-col">
        <TableCell
          field={"pid"}
          value={`PID:${process.pid}`}
          tooltip={getProcessDescription("pid")}
        />
        <TableCell
          field={"parent"}
          value={`PID:${process.parent}`}
          tooltip={getProcessDescription("parent")}
        />
        <TableCell field={"mem"} value={process.mem} tooltip={getProcessDescription("mem")} />
        <TableCell
          field={"*kstack"}
          value={process.kstack}
          tooltip={getProcessDescription("kstack")}
        />

        <PopoverCell
          modified={checkpoint.state !== process.state}
          field={"state"}
          value={process.state}
          tooltip={getProcessDescription("state")}
          error={errors?.["state"]}
        >
          <div className="flex flex-col gap-[8px]">
            {Object.values(ProcessState).map((state) => (
              <Button
                className="h-[28px] text-sm"
                key={state}
                variant={state === process.state ? "default" : "secondary"}
                onClick={() => setState(state)}
              >
                {state}
              </Button>
            ))}
          </div>
        </PopoverCell>

        <TableCell
          field={"*context"}
          value={process.kstack}
          tooltip={getProcessDescription("context")}
        />
        <TableCell field={"chan"} value={process.chan} tooltip={getProcessDescription("chan")} />
        <TableCell
          field={"killed"}
          value={process.killed}
          tooltip={getProcessDescription("killed")}
        />
        <TableCell
          field={"ofile"}
          value={`{ ${process.ofile.join(", ")} }`}
          tooltip={getProcessDescription("ofile")}
        />
        <TableCell field={"cwd"} value={process.cwd} tooltip={getProcessDescription("cwd")} />
        <TableCell field={"tf"} value={process.tf} tooltip={getProcessDescription("tf")} />
        <div className="flex h-[84px] w-full items-center justify-center border-[1px] border-gray-300 bg-gray-100 p-[4px] text-xs text-gray-500">
          User Stack
        </div>
        <div className="flex h-[84px] w-full items-center justify-center border-[1px] border-gray-300 bg-gray-100 p-[4px] text-xs text-gray-500">
          User Address Space
        </div>
        <EllipsesCell />
      </div>
    </div>
  );
};
