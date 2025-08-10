import React from "react";
import { ThreadAction, type Thread, type ThreadsController } from "../types";
import { Button } from "@/components/ui/button";
import tailwindcolors from "tailwindcss/colors";
interface Props {
  controller: ThreadsController;
}

const ACTIONS: Record<ThreadAction, string> = {
  [ThreadAction.LOCK_ACQUIRE]: "acquires",
  [ThreadAction.LOCK_RELEASE]: "releases",
  [ThreadAction.LOCK_WAIT]: "waits on",
  [ThreadAction.SEM_POST]: "posts to",
  [ThreadAction.SEM_WAIT]: "waits for",
  [ThreadAction.SEM_PASS]: "passes",
  [ThreadAction.CRITICAL_SECTION_ENTER]: "enters",
  [ThreadAction.CRITICAL_SECTION_EXIT]: "exits",
  [ThreadAction.CV_WAIT]: "waits for",
  [ThreadAction.CV_SIGNAL]: "signals to",
  [ThreadAction.CV_SKIP]: "skips the wait call for",
};

export const RunThreads: React.FunctionComponent<Props> = ({ controller }) => {
  const hasExited = (thread: Thread) => {
    return controller.threadState[thread.id]?.timeStep === thread.timeSteps;
  };

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
                  color:
                    // @ts-expect-error tailwindcolors
                    tailwindcolors[controller.colors[controller.blockingEvent.resourceId]][500],
                }}
              >
                {controller.blockingEvent.resourceId}
              </span>
              {controller.blockingEvent.secondaryResourceId &&
                controller.blockingEvent.secondaryAction && (
                  <>
                    <span className="text-xs">
                      {" "}
                      and {ACTIONS[controller.blockingEvent.secondaryAction]}
                    </span>

                    <span
                      className="text-xs"
                      style={{
                        color:
                          // @ts-expect-error tailwindcolors
                          tailwindcolors[
                            controller.colors[controller.blockingEvent.secondaryResourceId]
                          ]?.[500] ?? "black",
                      }}
                    >
                      {controller.blockingEvent.secondaryResourceId}
                    </span>
                  </>
                )}
              <span className="text-muted-foreground text-xs">
                on Line {controller.blockingEvent.timeStep}
              </span>
            </div>
          </Button>
        ) : (
          controller.threads.map((thread) => (
            <Button
              key={thread.id}
              variant={
                !controller.canRun(thread) || hasExited(thread)
                  ? "secondary"
                  : thread.id === controller.running?.id
                    ? "outline"
                    : "default"
              }
              disabled={!controller.canRun(thread) || hasExited(thread)}
              onClick={() =>
                controller.canRun(thread) &&
                controller.runThread(thread.id === controller.running?.id ? undefined : thread)
              }
            >
              {hasExited(thread)
                ? `${thread.id} Exited`
                : !controller.canRun(thread)
                  ? `${thread.id} is waiting...`
                  : thread.id === controller.running?.id
                    ? `Suspend ${thread.id}`
                    : `Run ${thread.id}`}
            </Button>
          ))
        )}
      </div>
    </div>
  );
};
