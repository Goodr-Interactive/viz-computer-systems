import React from "react";
import type { Thread, ThreadsController } from "../types";
import { ThreadTimeline } from "./ThreadTimeline";
import { Label } from "@/components/ui/label";
import { ResourceTimeline } from "./ResourceTimeline";
import { Badge } from "@/components/ui/badge";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ThreadPlayer: React.FunctionComponent<Props> = ({ thread, controller }) => {
  const atStart = Object.values(controller.threadState).every(({ timeStep }) => timeStep === 0);
  const atEnd = controller.threadState[thread.id]?.timeStep === thread.timeSteps;

  return (
    <div className="flex h-full w-[224px] flex-col gap-[12px] rounded-lg border p-[12px]">
      <div className="flex h-[24px] w-full items-center justify-between">
        <Label>{thread.id}</Label>
        {!atStart ? (
          atEnd ? (
            <Badge variant={"secondary"}>Exited</Badge>
          ) : controller.isWaiting(thread) ? (
            <Badge variant={"outline"}>Waiting</Badge>
          ) : thread.id === controller.running?.id ? (
            <Badge>Running</Badge>
          ) : (
            <Badge variant={"outline"}>Suspended</Badge>
          )
        ) : null}
      </div>

      <div className="flex h-full gap-[4px]">
        <ThreadTimeline thread={thread} controller={controller} />
        <ResourceTimeline thread={thread} controller={controller} />
      </div>

      <span className="text-muted-foreground text-xs font-light">
        {thread.id} is executing line {controller.threadState[thread.id].timeStep}
      </span>
    </div>
  );
};
