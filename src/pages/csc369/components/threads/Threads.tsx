import React from "react";
import type { Semaphore, Thread, Lock, ConditionVariable } from "./types";
import { useThreads } from "./hooks";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Controls, EventsList, RunThreads, ThreadsDisplay } from "./components";
import { ResourceDisplay } from "./components/ResourceDisplay";

export interface ThreadsProps {
  title: string;
  description: string;
  threads: Thread[];
  locks?: Lock[];
  semaphores?: Semaphore[];
  conditionVariables?: ConditionVariable[];
}

export const Threads: React.FunctionComponent<ThreadsProps> = ({
  title,
  description,
  threads,
  locks,
  semaphores,
  conditionVariables,
}) => {
  const controller = useThreads(threads, locks ?? [], semaphores ?? [], conditionVariables ?? []);

  return (
    <div className="flex h-[100vh] w-full flex-col px-[56px] pt-[24px] pb-[56px]">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mb-[24px] text-base">
        <span>{description}</span>
      </p>
      <ResizablePanelGroup className="rounded-lg border" direction="horizontal">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <ThreadsDisplay controller={controller} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className="max-w-[300px]">
              <ResourceDisplay controller={controller} />
            </ResizablePanel>
          </ResizablePanelGroup>

          <ResizableHandle />

          <ResizablePanelGroup className="max-h-[150px]" direction="horizontal">
            <ResizablePanel>
              <Controls controller={controller} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <RunThreads controller={controller} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanelGroup>

        <ResizableHandle />

        <ResizablePanelGroup className="max-w-[350px]" direction="vertical">
          <ResizablePanel>
            <EventsList controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanelGroup>
    </div>
  );
};
