import React from "react";
import type { ThreadsController } from "../types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface Props {
  controller: ThreadsController;
}

export const Controls: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Playback</h1>
      <div className="mt-[12px] flex w-full gap-[24px]">
        <Button onClick={controller.reset}>Reset</Button>
        <div className="flex w-full flex-col gap-[16px]">
          <div className="flex w-full justify-between">
            <Label>Playback Speed</Label>
            <Label>{controller.playbackSpeed.toFixed(1)}x</Label>
          </div>
          <Slider
            onValueChange={([value]) => controller.setPlaybackSpeed(value)}
            name="Playback Speed"
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
