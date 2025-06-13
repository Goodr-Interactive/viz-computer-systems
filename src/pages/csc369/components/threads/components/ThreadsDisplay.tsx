import React from "react";
import type { ThreadsController } from "../types";
import { ThreadPlayer } from "./ThreadPlayer";

interface Props {
  controller: ThreadsController;
}

export const ThreadsDisplay: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full flex-col gap-[12px] py-[12px] pb-[56px]">
      <h1 className="px-[12px] text-xl font-medium tracking-tight">Threads</h1>
      <div className="flex h-full w-full items-center justify-center gap-[126px]">
        {controller.threads.map((thread) => (
          <ThreadPlayer key={thread.id} thread={thread} controller={controller} />
        ))}
      </div>
    </div>
  );
};
