import React from "react";
import type { SchedulerController } from "../types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";


interface Props {
    controller: SchedulerController;
}

export const SchedulerSettings : React.FunctionComponent<Props> = ({
    controller
}) => {
    return (
        <div className="w-full h-full p-[12px] flex flex-col gap-[24px]">
            <h1 className="text-xl font-medium tracking-tight">
                Settings
            </h1>
            <div className="w-full flex items-center justify-around gap-[36px]">
                <div className="w-full flex flex-col gap-[16px]">
                <div className="w-full flex justify-between">
                    <Label>Context Switch Frequency</Label>
                    <Label>{controller.contextSwitchFrequency.toFixed(1)}s</Label>
                </div>  
                <Slider onValueChange={([value]) => controller.setContextSwitchFrequency(value)} name="Context Switch Frequency" defaultValue={[controller.contextSwitchFrequency]} min={1} max={20} step={0.1} />
                </div>
                <div className="w-full flex flex-col gap-[16px]">
                <div className="w-full flex justify-between">
                    <Label>Context Switch Duration</Label>
                    <Label>{controller.contextSwitchDuration.toFixed(1)}s</Label>
                </div>  
                <Slider onValueChange={([value]) => controller.setContextSwitchDuration(value)} name="Context Switch Duration" defaultValue={[controller.contextSwitchDuration]} min={0} max={5} step={0.1} />
                </div>
            </div>
        </div>
    )
}
