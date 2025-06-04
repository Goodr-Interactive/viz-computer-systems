import React from "react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { formatMetric } from "../utils";
import type { SchedulerController } from "../types";
import { Progress } from "@/components/ui/progress";

interface Props {
  time: number;
  controller: SchedulerController;
}

export const ContextSwitchCard: React.FunctionComponent<Props> = ({ time, controller }) => {
  return (
    <Card className="h-[176px] w-[300px]">
      <CardHeader>
        <CardTitle>Context Switch</CardTitle>
        <div className="mt-[8px] flex w-full justify-between">
          <Label>Time</Label>
          <Label>
            {formatMetric(time)}/ {controller.contextSwitchDuration.toFixed(1)}s
          </Label>
        </div>
        <Progress value={time / (controller.contextSwitchDuration * 10)} />
      </CardHeader>
      <CardFooter className="flex flex-wrap gap-[12px]">
        {controller.lastRun && (
          <Badge variant={"secondary"}>From: PID:{controller.lastRun.pid}</Badge>
        )}
        {controller.nextRun && <Badge>To: PID:{controller.nextRun.pid}</Badge>}
      </CardFooter>
    </Card>
  );
};
