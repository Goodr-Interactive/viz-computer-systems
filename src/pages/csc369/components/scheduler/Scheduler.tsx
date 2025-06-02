import React from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useScheduler } from "./hooks";
import {
  DirectExecution,
  MenuBar,
  Playback,
  ProcessController,
  ProcessQueue,
  SchedulerSettings,
} from "./components";
import type { Algorithm } from "./types";


interface Props {
  allowedAlgorithms?: Array<Algorithm>;
}

export const Scheduler: React.FunctionComponent<Props> = ({
  allowedAlgorithms
}) => {
  const controller = useScheduler(allowedAlgorithms);

  return (
    <div className="flex h-[100vh] w-full flex-col px-[56px] pt-[24px] pb-[56px]">
      <h1 className="text-3xl font-bold tracking-tight">The Scheduler</h1>
      <p className="text-muted-foreground mb-[24px] text-base">
        <span>Explore CPU Scheduling Algorithms</span>
      </p>
      <ResizablePanelGroup className="rounded-lg border" direction="vertical">
        <ResizablePanel className="min-h-[64px]">
          <MenuBar controller={controller} allowedAlgorithms={allowedAlgorithms}/>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
            <DirectExecution controller={controller}/>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="max-w-[424px]">
            <ProcessQueue controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>
        <ResizableHandle />
        <ResizablePanelGroup className="max-h-[150px]" direction="horizontal">
          <ResizablePanel>
            <SchedulerSettings controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <ProcessController controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <Playback controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanelGroup>
    </div>
  );
};
