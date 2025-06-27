import React from "react";
import { ThreadAction, type ThreadEvent, type ThreadsController } from "../types";
import tailwindcolors from "tailwindcss/colors";

interface Props {
  controller: ThreadsController;
  event: ThreadEvent;
}

const ACTIONS: Record<ThreadAction, string> = {
  [ThreadAction.LOCK_ACQUIRE]: "has acquired",
  [ThreadAction.LOCK_RELEASE]: "has released",
  [ThreadAction.LOCK_WAIT]: "is waiting on",
  [ThreadAction.SEM_POST]: "has posted to",
  [ThreadAction.SEM_WAIT]: "is waiting for",
  [ThreadAction.SEM_PASS]: "has passed",
  [ThreadAction.CRITICAL_SECTION_ENTER]: "has entered",
  [ThreadAction.CRITICAL_SECTION_EXIT]: "has exited",
  [ThreadAction.CV_WAIT]: "is waiting for",
  [ThreadAction.CV_SIGNAL]: "signalled to",
};

export const EventDisplay: React.FunctionComponent<Props> = ({ event, controller }) => {
  return (
    <div className="flex flex-wrap items-center gap-[6px]">
      <span className="text-xs font-bold">{event.threadId} </span>
      <span className="text-xs">{ACTIONS[event.action]}</span>

      <span
        className="text-xs"
        // @ts-expect-error tailwindcolors
        style={{ color: tailwindcolors[controller.colors[event.resourceId]][500] }}
      >
        {event.resourceId}
      </span>
      <span className="text-muted-foreground text-xs">on Line {event.timeStep}</span>
    </div>
  );
};
