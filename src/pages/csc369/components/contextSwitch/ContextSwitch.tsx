import React from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useContextSwitchController } from "./hooks";
import { State, Controller } from "./components";
import { TooltipProvider } from "../../../../components/ui/tooltip";
import { StepTitle } from "./components/StepTitle";
import { Toaster } from "@/components/ui/sonner";

export const ContextSwitch: React.FunctionComponent = () => {
  const controller = useContextSwitchController();

  return (
    <TooltipProvider>
      <div id="fireworks" className="pointer-events-none fixed inset-0 z-50 h-full w-full" />
      <Toaster theme="system" position="top-center" />
      <div className="flex h-[909px] w-full flex-col px-[56px] pt-[24px] pb-[56px]">
        <h1 className="text-3xl font-bold tracking-tight">The xv6 Context Switch</h1>
        <p className="text-muted-foreground mb-[24px] text-base">
          <span>
            The following example demostrates the mechanics of a timer interrupt in the xv6
            Operating System. Your task is to save and restore the correct registers at each step.
            Click on a cell to copy it's value, then click on another cell to paste.
          </span>
        </p>
        <ResizablePanelGroup className="rounded-lg border" direction="vertical">
          <ResizablePanel className="max-h-[76px]">
            <StepTitle controller={controller} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <State controller={controller} />
          </ResizablePanel>
          <ResizablePanel className="max-h-[70px]">
            <Controller controller={controller} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};
