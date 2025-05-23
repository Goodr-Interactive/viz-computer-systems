import React from "react";
import { ProcessStatus, type SchedulerController } from "../types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  controller: SchedulerController;
}

export const ProcessController: React.FunctionComponent<Props> = ({ controller }) => {

  const addProcess = (seconds: number) => {
    return () => {
        controller.addProcess({
            pid: controller.processes.length + 1,
            duration: seconds,
            events: [],
            status: ProcessStatus.WAITING,
            enquedAt: new Date().getTime(),
            completedAt: undefined
        })
    }
  }

  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Process Controller</h1>
      <Label className="text-muted-foreground font-light">Add a process to the Process Queue</Label>
      <div className="w-full flex gap-[12px] mt-[12px]">
        <Button onClick={addProcess(2)} variant={"outline"}>2s</Button>
        <Button onClick={addProcess(5)} variant={"outline"}>5s</Button>
        <Button onClick={addProcess(10)} variant={"outline"}>10s</Button>
        <Button onClick={addProcess(20)} variant={"outline"}>20s</Button>
      </div>
    </div>
  );
};
