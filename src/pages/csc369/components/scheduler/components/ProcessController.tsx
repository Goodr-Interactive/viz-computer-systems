import React from "react";
import type { SchedulerController } from "../types";

interface Props {
  controller: SchedulerController;
}

export const ProcessController: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Process Controller</h1>
    </div>
  );
};
