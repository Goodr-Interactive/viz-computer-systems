import React from "react";
import type { ContextSwitchController } from "../hooks";
import { TableCell } from "./TableCell";
import { EllpsesCell } from "./EllipsesCell";
import type { Context } from "../types";
import { getContextDescription, getProcessDescription } from "../utils";

interface Props {
  controller: ContextSwitchController;
}

export const ProcessTable: React.FunctionComponent<Props> = ({ controller }) => {
  const context = Object.entries(controller.processA.context) as Array<
    [keyof Context, Context[keyof Context]]
  >;

  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-sm">Process Table</span>
      <div className="flex flex-col w-[180px]">
        <EllpsesCell />
        <TableCell field={"pid"} value={`PID:${controller.processA.pid}`} tooltip={getProcessDescription("pid")}/>
        <TableCell field={"parent"} value={`PID:${controller.processA.parent}`} tooltip={getProcessDescription("parent")}/>
        <TableCell field={"mem"} value={controller.processA.mem} tooltip={getProcessDescription("mem")}/>
        <TableCell field={"*kstack"} value={controller.processA.kstack} tooltip={getProcessDescription("kstack")}/>
        <TableCell field={"state"} value={controller.processA.state} tooltip={getProcessDescription("state")}/>
        {/* <TableCell field={"chan"} value={controller.processA.chan} />
        <TableCell field={"killed"} value={controller.processA.killed} />
        <TableCell field={"ofile"} value={controller.processA.ofile.join(", ")} />
        <TableCell field={"cwd"} value={controller.processA.cwd} />
        <TableCell field={"tf"} value={controller.processA.tf} /> */}
        <EllpsesCell />
        {context.map(([field, value]) => (
          <TableCell 
            field={field} 
            value={value}
            tooltip={getContextDescription(field)}
        />
        ))}
      </div>
    </div>
  );
};
