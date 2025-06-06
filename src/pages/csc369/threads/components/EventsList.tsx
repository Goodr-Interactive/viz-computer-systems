import React from "react";
import type { ThreadsController } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventDisplay } from "./EventDisplay";

interface Props {
  controller: ThreadsController;
}

export const EventsList: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full flex-col gap-[12px] py-[12px]">
      <h1 className="px-[12px] text-xl font-medium tracking-tight">Events</h1>
      <ScrollArea className="h-full px-[12px]">
        <div className="flex h-full w-full flex-col gap-[12px]">
          {controller.events.length ? (
            controller.events.map((event) => (
              <EventDisplay key={`${event.action}:${event.timeStep}`} event={event} />
            ))
          ) : (
            <div className="bg-grey flex h-full w-full items-center justify-center">No Events</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
