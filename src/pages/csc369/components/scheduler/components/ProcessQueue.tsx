import React, { useMemo, useRef } from "react";
import type { SchedulerController } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessCard } from "./ProcessCard";

enum Tab {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

interface Props {
  controller: SchedulerController;
}

function partition<T>(data: Array<T>, condition: (item: T) => boolean) : [Array<T>, Array<T>] {
    return data.reduce(([yes, no], item) => {
        if (condition(item)) {
            return [
                [...yes, item],
                no
            ]
        }
        return [
            yes,
            [...no, item]
        ]
    }, [[], []] as [Array<T>, Array<T>])
}   

export const ProcessQueue: React.FunctionComponent<Props> = ({ controller }) => {

  const [active, completed] = useMemo(() => partition(controller.processes, p => p.completedAt === undefined), [controller.processes]);

  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full w-full flex-col gap-[12px] py-[12px]">
      <h1 className="text-xl font-medium tracking-tight px-[12px]">Proccess Queue</h1>
      <Tabs defaultValue={Tab.ACTIVE} className="w-full h-full pb-[84px]">
        <TabsList className="h-[36px] mx-[12px] w-[376px]">
          <TabsTrigger value={Tab.ACTIVE}>Active Processes</TabsTrigger>
          <TabsTrigger value={Tab.COMPLETED}>Completed Processes</TabsTrigger>
        </TabsList>
        <TabsContent value={Tab.ACTIVE} className="h-full">
          <ScrollArea className="h-full px-[12px]">
            <div className="h-full w-full flex flex-col gap-[12px]">
                {active.map(p => (
                    <ProcessCard key={p.pid} process={p}/>
                ))}
            </div>
            
          </ScrollArea>
        </TabsContent>
        <TabsContent value={Tab.COMPLETED} className="h-full">
        <ScrollArea className="h-full px-[12px]">
        <div className="h-full w-full flex flex-col gap-[12px]">
            {completed.map(p => (
                <ProcessCard key={p.pid} process={p}/>
            ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
