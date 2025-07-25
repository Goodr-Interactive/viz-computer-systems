import React from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useContextSwitchController } from "./hooks";
import { State, Controller } from "./components";
import { TooltipProvider } from "../../../../components/ui/tooltip";

interface Props {}

export const ContextSwitch: React.FunctionComponent<Props> = () => {
  const controller = useContextSwitchController();

  return (
    <TooltipProvider>
      <div className="flex h-[100vh] w-full flex-col px-[56px] pt-[24px] pb-[56px]">
        <h1 className="text-3xl font-bold tracking-tight">Context Switch</h1>
        <p className="text-muted-foreground mb-[24px] text-base">
          <span>
            The following example demostrates the mechanics of a Context Switch between two user
            processes, caused by a timer interrupt
          </span>
        </p>
        <ResizablePanelGroup className="rounded-lg border" direction="vertical">
          <ResizablePanel>
            <State controller={controller} />
          </ResizablePanel>
          {/* <ResizableHandle />
        <ResizablePanel className="max-h-[100px]">
          <Controller controller={controller} />
        </ResizablePanel> */}
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
};
