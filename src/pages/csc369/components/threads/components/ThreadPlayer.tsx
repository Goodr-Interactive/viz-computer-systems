import React from "react";
import type { Thread, ThreadsController } from "../types";
import { ThreadTimeline } from "./ThreadTimeline";
import { Label } from "@/components/ui/label";
import { ResourceTimeline } from "./ResourceTimeline";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ThreadPlayer: React.FunctionComponent<Props> = ({ thread, controller }) => {
  return (
    <div className="flex h-full w-[250px] flex-col gap-[12px] rounded-lg border p-[12px]">
      <Label>{thread.id}</Label>
      <div className="flex gap-[4px] h-full">
        <ThreadTimeline thread={thread} controller={controller} />
        <ResourceTimeline thread={thread} controller={controller}/>
      </div>
      
      <span className="text-muted-foreground text-xs font-light">
        {thread.id} is executing line {controller.threadState[thread.id].timeStep}
      </span>
    </div>
  );
};
