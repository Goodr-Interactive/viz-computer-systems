import React from "react";
import { ThreadAction, type ThreadEvent, type ThreadsController } from "../types";
import tailwindcolors from "tailwindcss/colors";

interface Props {
  controller: ThreadsController;
  event: ThreadEvent;
}

const ACTIONS: Record<ThreadAction, string> = {
  [ThreadAction.LOCK_ACQUIRE]: "acquires",
  [ThreadAction.LOCK_RELEASE]: "releases",
  [ThreadAction.LOCK_WAIT]: "waits on",
  [ThreadAction.SEM_POST]: "posts to",
  [ThreadAction.SEM_WAIT]: "waits for",
  [ThreadAction.SEM_PASS]: "passes",
  [ThreadAction.CRITICAL_SECTION_ENTER]: "enters",
  [ThreadAction.CRITICAL_SECTION_EXIT]: "returns from",
  [ThreadAction.CV_WAIT]: "waits for",
  [ThreadAction.CV_SIGNAL]: "signals to",
  [ThreadAction.CV_SKIP]: "skips the wait call for",
};

export const EventDisplay: React.FunctionComponent<Props> = ({ event, controller }) => {
  return (
    <div className="flex flex-wrap items-center gap-[6px]">
      <span className="text-xs font-bold">{event.threadId} </span>
      <span className="text-xs">{ACTIONS[event.action]}</span>

      <span
        className="text-xs"
        // @ts-expect-error tailwindcolors
        style={{ color: tailwindcolors[controller.colors[event.resourceId]]?.[500] ?? "black" }}
      >
        {event.resourceId}
      </span>
      <span className="text-muted-foreground text-xs">on Line {event.timeStep}</span>
    </div>
  );
};
