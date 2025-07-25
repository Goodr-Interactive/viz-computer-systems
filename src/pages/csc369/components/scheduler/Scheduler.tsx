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
import { useMediaQuery } from "../../../../hooks";
import { cn } from "../../../../lib/utils";

interface Props {
  allowedAlgorithms?: Algorithm[];
}

export const Scheduler: React.FunctionComponent<Props> = ({ allowedAlgorithms }) => {
  const controller = useScheduler(allowedAlgorithms);
  const isDesktop = useMediaQuery();


  return (
    <div className={cn(`flex h-[100vh] w-full flex-col px-[56px] pt-[24px] pb-[56px]`, !isDesktop && "h-[200vh] px-[12px]")}>
      <h1 className="text-3xl font-bold tracking-tight">The Scheduler</h1>
      <p className="text-muted-foreground mb-[24px] text-base">
        <span>Explore CPU Scheduling Algorithms</span>
      </p>
      <ResizablePanelGroup className="rounded-lg border" direction="vertical">
        <ResizablePanel className="min-h-[64px]">
          <MenuBar controller={controller} allowedAlgorithms={allowedAlgorithms} />
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanelGroup direction={isDesktop ? "horizontal" : "vertical"}>
          <ResizablePanel className={cn("h-full", !isDesktop && "max-h-[500px]")}>
            <DirectExecution controller={controller} />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel className={cn("max-w-[424px] h-full", !isDesktop && "max-h-[500px]")}>
            <ProcessQueue controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>

        <ResizableHandle />

        <ResizablePanelGroup className={cn("max-h-[170px]", !isDesktop && "max-h-[500px]")} direction={isDesktop ? "horizontal" : "vertical"}>
          <ResizablePanel className={!isDesktop ? "max-h-[170px]" : undefined}>
            <SchedulerSettings controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className={!isDesktop ? "max-h-[170px]" : undefined}>
            <ProcessController controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className={!isDesktop ? "max-h-[170px]" : undefined}>
            <Playback controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>

      </ResizablePanelGroup>
    </div>
  );
};
