import React from "react";
import { Algorithm, ProcessStatus, type SchedulerController } from "../types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  controller: SchedulerController;
}

const UNKNOWN_RUNTIME_ALGORITHMS = [Algorithm.CFS, Algorithm.RR];

export const ProcessController: React.FunctionComponent<Props> = ({ controller }) => {
  const addProcess = (seconds?: number) => {
    return () => {
      controller.addProcess({
        pid: controller.processes.length + 1,
        duration: seconds ?? Math.floor((Math.random() + 0.05) * 20),
        events: [],
        status: ProcessStatus.WAITING,
        enquedAt: controller.clock,
        completedAt: undefined,
        unknownRuntime: !seconds,
        vruntime: 0,
      });
    };
  };

  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Process Controller</h1>
      <Label className="text-muted-foreground font-light">Add a process to the Process Queue</Label>
      <div className="mt-[12px] flex w-full gap-[12px]">
        <Button onClick={addProcess(2)} variant={"outline"}>
          2s
        </Button>
        <Button onClick={addProcess(5)} variant={"outline"}>
          5s
        </Button>
        <Button onClick={addProcess(10)} variant={"outline"}>
          10s
        </Button>
        <Button onClick={addProcess(20)} variant={"outline"}>
          20s
        </Button>
        {UNKNOWN_RUNTIME_ALGORITHMS.includes(controller.algorithm) && (
          <Button onClick={addProcess(undefined)} variant={"secondary"}>
            Unknown
          </Button>
        )}
      </div>
    </div>
  );
};
