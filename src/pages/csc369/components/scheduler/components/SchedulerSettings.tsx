import React from "react";
import { PREEMPTIVE_ALGORITHMS, SchedulerState, type SchedulerController } from "../types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  controller: SchedulerController;
}

export const SchedulerSettings: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full flex-col gap-[24px] p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Settings</h1>
      <div className="flex w-full items-center justify-around gap-[36px]">
        {PREEMPTIVE_ALGORITHMS.includes(controller.algorithm) && (
          <div className="flex w-full flex-col gap-[16px]">
            <div className="flex w-full justify-between">
              <Label>Scheduling Quantum</Label>
              <Label>{controller.contextSwitchFrequency.toFixed(1)}s</Label>
            </div>
            <Slider
              onValueChange={([value]) => controller.setContextSwitchFrequency(value)}
              name="Context Switch Frequency"
              defaultValue={[controller.contextSwitchFrequency]}
              min={1}
              max={20}
              step={0.1}
              disabled={controller.state === SchedulerState.RUNNING}
            />
          </div>
        )}

        <div className="flex w-full flex-col gap-[16px]">
          <div className="flex w-full justify-between">
            <Label>Context Switch Duration</Label>
            <Label>{controller.contextSwitchDuration.toFixed(1)}s</Label>
          </div>
          <Slider
            onValueChange={([value]) => controller.setContextSwitchDuration(value)}
            name="Context Switch Duration"
            defaultValue={[controller.contextSwitchDuration]}
            min={0}
            max={5}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
};
