import React from "react";
import { ProcessStatus, SchedulerState, type SchedulerController } from "../types";
import { IconButton } from "./IconButton";
import { Play, Undo, Columns, SkipBack, SkipForward } from "@mynaui/icons-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Props {
  controller: SchedulerController;
}

export const Playback: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Playback</h1>
      <div className="mt-[12px] flex w-full gap-[24px]">
        <div className="flex gap-[12px]">
          {/* <IconButton onClick={controller.reset}>
            <SkipBack height={24} width={24} />
          </IconButton> */}
          {controller.state !== SchedulerState.RUNNING && (
            <IconButton onClick={controller.play} disabled={controller.processes.every(({ status }) => status === ProcessStatus.COMPLETE)}>
              <Play height={30} width={30} />
            </IconButton>
          )}

          {controller.state !== SchedulerState.PAUSED && (
            <IconButton onClick={controller.pause}>
              <Columns height={24} width={24} />
            </IconButton>
          )}

          <IconButton onClick={controller.reset}>
            <Undo height={24} width={24} />
          </IconButton>

          {/* <IconButton onClick={controller.reset}>
            <SkipForward height={24} width={24} />
          </IconButton> */}
        </div>
        <div className="flex w-full flex-col gap-[16px]">
          <div className="flex w-full justify-between">
            <Label>Playback Speed</Label>
            <Label>{controller.playbackSpeed.toFixed(1)}x</Label>
          </div>
          <Slider
            onValueChange={([value]) => controller.setPlaybackSpeed(value)}
            name="Context Switch Duration"
            defaultValue={[controller.playbackSpeed]}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
};
