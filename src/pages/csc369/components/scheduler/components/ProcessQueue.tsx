import React from "react";
import type { SchedulerController } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

enum Tab {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

interface Props {
  controller: SchedulerController;
}

export const ProcessQueue: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full flex-col gap-[12px] p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Proccess Queue</h1>
      <Tabs defaultValue={Tab.ACTIVE} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value={Tab.ACTIVE}>Active Processes</TabsTrigger>
          <TabsTrigger value={Tab.COMPLETED}>Completed Processes</TabsTrigger>
        </TabsList>
        <TabsContent value={Tab.ACTIVE}>
          <ScrollArea></ScrollArea>
        </TabsContent>
        <TabsContent value={Tab.COMPLETED}></TabsContent>
      </Tabs>
    </div>
  );
};
