import React, { useMemo } from "react";
import { ProcessStatus, type SchedulerController } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessCard } from "./ProcessCard";
import { partition } from "../utils";

enum Tab {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

interface Props {
  controller: SchedulerController;
}

export const ProcessQueue: React.FunctionComponent<Props> = ({ controller }) => {
  const [active, completed] = useMemo(
    () => partition(controller.processes.filter(p => p.status !== ProcessStatus.RUNNING), (p) => p.completedAt === undefined),
    [controller.processes]
  );

  return (
    <div className="flex h-full w-full flex-col gap-[12px] py-[12px]">
      <h1 className="px-[12px] text-xl font-medium tracking-tight">Proccess Queue</h1>
      <Tabs defaultValue={Tab.ACTIVE} className="h-full w-full pb-[72px]">
        <TabsList className="mx-[12px] h-[36px] w-[376px]">
          <TabsTrigger value={Tab.ACTIVE}>Active Processes {active.length ? `(${active.length})` : ""}</TabsTrigger>
          <TabsTrigger value={Tab.COMPLETED}>Completed Processes {completed.length ? `(${completed.length})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value={Tab.ACTIVE} className="h-full">
          <ScrollArea className="h-full px-[12px]">
            <div className="flex h-full w-full flex-col gap-[12px]">
              {active.map((p) => (
                <ProcessCard key={p.pid} process={p} algorithm={controller.algorithm} clock={controller.clock}/>
              ))}
              {!active.length && (
                <div className="h-full w-full bg-grey flex items-center justify-center">
                  No Active Processes
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value={Tab.COMPLETED} className="h-full">
          <ScrollArea className="h-full px-[12px]">
            <div className="flex h-full w-full flex-col gap-[12px]">
              {completed.map((p) => (
                <ProcessCard key={p.pid} process={p} algorithm={controller.algorithm} clock={controller.clock}/>
              ))}
              {!completed.length && (
                <div className="h-full w-full bg-grey flex items-center justify-center">
                  No Completed Processes
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
