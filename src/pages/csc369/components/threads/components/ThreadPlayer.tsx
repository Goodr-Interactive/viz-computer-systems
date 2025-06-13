import React from "react";
import type { Thread, ThreadsController } from "../types";
import { ThreadTimeline } from "./ThreadTimeline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ThreadPlayer: React.FunctionComponent<Props> = ({ thread, controller }) => {
  return (
    <div className="flex h-full w-[250px] flex-col gap-[12px] rounded-lg border p-[12px]">
      <Label>{thread.id}</Label>
      <ThreadTimeline thread={thread} controller={controller} />
      <span className="text-muted-foreground text-xs font-light">
        {thread.id} is executing line {controller.threadState[thread.id].timeStep}
      </span>
      <Button
        onClick={() =>
          thread.id === controller.running?.id
            ? controller.runThread(undefined)
            : controller.runThread(thread)
        }
      >
        {thread.id === controller.running?.id ? "Suspend" : "Run"}
      </Button>
    </div>
  );
};
