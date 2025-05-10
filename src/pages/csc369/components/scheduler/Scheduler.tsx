import React from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useScheduler } from "./hooks";
import { DirectExecution, MenuBar, ProcessController, ProcessQueue, SchedulerSettings } from "./components";



export const Scheduler : React.FunctionComponent = () => {
    const controller = useScheduler();

    return (
        <div className="flex flex-col w-full h-[100vh] px-[56px] pt-[24px] pb-[56px]">
        <h1 className="text-3xl font-bold tracking-tight">
            The Scheduler
        </h1>
        <p className="text-base text-muted-foreground mb-[24px]">
            <span>Explore CPU Scheduling Algorithms</span>
        </p>
        <ResizablePanelGroup className="rounded-lg border" direction="vertical">
            <ResizablePanel className="min-h-[64px]">
                <MenuBar controller={controller}/>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>
                    <DirectExecution controller={controller}/>
                </ResizablePanel>
                <ResizableHandle />
            <ResizablePanel className="max-w-[350px]">
                <ProcessQueue controller={controller}/>
            </ResizablePanel>
            </ResizablePanelGroup>
            <ResizableHandle />
            <ResizablePanelGroup className="max-h-[150px]" direction="horizontal">
            <ResizablePanel>
                    <SchedulerSettings controller={controller}/>
                </ResizablePanel>
                
                <ResizableHandle />
                <ResizablePanel>
                    <ProcessController controller={controller}/>
                </ResizablePanel>
            </ResizablePanelGroup>
          
        </ResizablePanelGroup>
        </div>
    )
}
