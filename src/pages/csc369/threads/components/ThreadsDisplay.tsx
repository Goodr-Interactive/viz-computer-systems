import React from "react";
import type { ThreadsController } from "../types";
import { ThreadPlayer } from "./ThreadPlayer";

interface Props {
  controller: ThreadsController;
}

export const ThreadsDisplay: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full items-center">
      {controller.threads.map((thread) => (
        <ThreadPlayer key={thread.id} thread={thread} controller={controller} />
      ))}
    </div>
  );
};
