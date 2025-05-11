import React from "react";
import type { SchedulerController } from "../types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Props {
  controller: SchedulerController;
}

export const DirectExecution: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full flex flex-col p-[12px] gap-[12px]">
        <div className="w-full flex justify-between">
            <h1 className="text-xl font-medium tracking-tight">Direct Execution</h1>
            <div className="w-[484px] flex justify-end flex-wrap gap-[12px]">
            <Badge>
                Elapsed: {3.2}s
            </Badge>
            <Badge variant={"secondary"}>
                CPU Active: {3.2}s
            </Badge>
            <Badge variant={"outline"}>
                Throughput: {3.2}s
            </Badge>
            <Badge className="bg-[var(--chart-2)]">
                Average Wait: {3.2}s
            </Badge>
            <Badge className="bg-[var(--chart-1)]">
                Average Response: {3.2}s
            </Badge>
            <Badge className="bg-[var(--chart-5)]">
                Average Turnaround: {3.2}s
            </Badge>
            </div>
        </div>
    </div>
  );
};
