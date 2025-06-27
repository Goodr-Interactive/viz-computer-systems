import React from "react";
import type { ThreadsController } from "../types";
import { Button } from "@/components/ui/button";

interface Props {
  controller: ThreadsController;
}

export const RunThreads : React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full p-[12px] flex-col">
      <h1 className="text-xl font-medium tracking-tight">Run Threads</h1>
      <div className="mt-[24px] flex w-full gap-[12px]">
        {controller.threads.map((thread) => (
          <Button
            variant={thread.id === controller.running?.id ? "secondary" : "default"}
            onClick={() =>
              controller.runThread(thread.id === controller.running?.id ? undefined : thread)
            }
          >
            {thread.id === controller.running?.id ? `Suspend ${thread.id}` : `Run ${thread.id}`}
          </Button>
        ))}
      </div>
    </div>
  );
};
