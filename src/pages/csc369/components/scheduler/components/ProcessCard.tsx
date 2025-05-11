import React, { useMemo } from "react";
import { ProcessStatus, type Process } from "../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface Props {
  process: Process;
}

type ProcessState = ["default" | "secondary" | "destructive" | "outline", string]

export const ProcessCard: React.FunctionComponent<Props> = ({ process }) => {
    
  const [variant, label] : ProcessState = useMemo(() => {
    switch(process.status) {
        case ProcessStatus.COMPLETE:
            return ["secondary", "Complete"];
        case ProcessStatus.RUNNING:
            return ["default", "Running"];
        case ProcessStatus.WAITING:
            return ["outline", "Waiting"]
    }
  }, [process.status])

  const runtime = 2

  return (
    <Card className="w-full">
        <CardHeader>
            <div className="w-full flex items-center justify-between">
            <CardTitle>
            PID:{process.pid}
        </CardTitle>
            <Badge variant={variant}>
                {label}
            </Badge>
            </div>
        
        <CardDescription>Created at: 0:04s</CardDescription>
        <div className="flex w-full justify-between mt-[8px]">
            <Label>vruntime</Label>
            <Label>{runtime.toFixed(1)} / {process.duration.toFixed(1)}s</Label>
          </div>
          <Progress
            value={runtime / process.duration * 100}
          />
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-[12px]">
            <Badge className="bg-[var(--chart-2)]">
                Wait: {3.2}s
            </Badge>
            <Badge className="bg-[var(--chart-1)]">
                Response: {3.2}s
            </Badge>
            <Badge className="bg-[var(--chart-5)]">
                Turnaround: {3.2}s
            </Badge>
        </CardFooter>
    </Card>
  );
};
