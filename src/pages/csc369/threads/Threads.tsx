import React from "react";
import type { Semaphore, Thread, Lock } from "./types";
import { useThreads } from "./hooks";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Controls, EventsList, ThreadsDisplay } from "./components";

interface Props {
  title: string;
  description: string;
  threads: Array<Thread>;
  locks: Array<Lock>;
  semaphores: Array<Semaphore>;
}

export const Threads: React.FunctionComponent<Props> = ({
  title,
  description,
  threads,
  locks,
  semaphores,
}) => {
  const controller = useThreads(threads, locks, semaphores);

  return (
    <div className="flex h-[100vh] w-full flex-col px-[56px] pt-[24px] pb-[56px]">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mb-[24px] text-base">
        <span>{description}</span>
      </p>
      <ResizablePanelGroup className="rounded-lg border" direction="horizontal">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>
            <ThreadsDisplay controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="min-h-[64px]">
            <Controls controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>
        <ResizableHandle />
        <ResizablePanel>
          <EventsList controller={controller} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
