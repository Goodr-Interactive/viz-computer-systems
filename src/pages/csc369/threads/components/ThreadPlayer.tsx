import React from "react";
import type { Thread, ThreadsController } from "../types";
import { ThreadTimeline } from "./ThreadTimeline";
import { Button } from "@/components/ui/button";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ThreadPlayer: React.FunctionComponent<Props> = ({ thread, controller }) => {
  return (
    <div className="rounded-lg border p-[12px]">
      <ThreadTimeline thread={thread} />
      <Button>{thread.id === controller.running?.id ? "Pause" : "Play"}</Button>
    </div>
  );
};
