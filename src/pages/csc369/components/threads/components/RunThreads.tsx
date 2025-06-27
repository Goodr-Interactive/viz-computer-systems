import React from "react";
import { ThreadAction, type ThreadsController } from "../types";
import { Button } from "@/components/ui/button";
import tailwindcolors from "tailwindcss/colors";
interface Props {
  controller: ThreadsController;
}

const ACTIONS: Record<ThreadAction, string> = {
  [ThreadAction.LOCK_ACQUIRE]: "will acquire",
  [ThreadAction.LOCK_RELEASE]: "will release",
  [ThreadAction.LOCK_WAIT]: "will wait on",
  [ThreadAction.SEM_POST]: "will post to",
  [ThreadAction.SEM_WAIT]: "will wait for",
  [ThreadAction.SEM_PASS]: "will pass",
  [ThreadAction.CRITICAL_SECTION_ENTER]: "will enter",
  [ThreadAction.CRITICAL_SECTION_EXIT]: "will exit",
  [ThreadAction.CV_WAIT]: "will wait for",
  [ThreadAction.CV_SIGNAL]: "will signal to",
};

export const RunThreads: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full flex-col p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Run Threads</h1>
      <div className="mt-[24px] flex w-full gap-[12px]">
        {controller.blockingEvent ? (
          <Button variant={"outline"} onClick={controller.unblockEvent}>
            <div className="flex items-center gap-[3px]">
            <span className="text-xs font-bold">{controller.blockingEvent.threadId} </span>
            <span className="text-xs">{ACTIONS[controller.blockingEvent.action]}</span>

            <span
              className="text-xs"
              style={{
                // @ts-expect-error tailwindcolors
                color: tailwindcolors[controller.colors[controller.blockingEvent.resourceId]][500],
              }}
            >
              {controller.blockingEvent.resourceId}
            </span>
            <span className="text-muted-foreground text-xs">
              on Line {controller.blockingEvent.timeStep}
            </span>
            </div>
            
          </Button>
        ) : (
          controller.threads.map((thread) => (
            <Button
              variant={thread.id === controller.running?.id ? "secondary" : "default"}
              onClick={() =>
                controller.runThread(thread.id === controller.running?.id ? undefined : thread)
              }
            >
              {thread.id === controller.running?.id ? `Suspend ${thread.id}` : `Run ${thread.id}`}
            </Button>
          ))
        )}
      </div>
    </div>
  );
};
