import React, { useEffect, useMemo, useState } from "react";
import { ProcessStatus, type Process } from "../types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { formatMetric, getResponseTime, getTurnaroundTime, getVirtualRuntime, getWaitTime } from "../utils";

interface Props {
  algorithm: Algorithm;
  process: Process;
}

type ProcessState = ["default" | "secondary" | "destructive" | "outline", string]

interface ProcessMetrics {
  wait: number;
  response: number;
  turnaround: number;
  vruntime: number;
}

export const ProcessCard: React.FunctionComponent<Props> = ({ process }) => {

  const now = new Date().getTime();

  const [metrics, setMetrics] = useState<ProcessMetrics>({
    wait: getWaitTime(process, now),
    response: getResponseTime(process, now),
    turnaround: getTurnaroundTime(process, now),
    vruntime: getVirtualRuntime(process, now)
  });
    
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

  const updateMetrics = () => {
    const now = new Date().getTime();
    setMetrics({
      wait: getWaitTime(process, now),
      response: getResponseTime(process, now),
      turnaround: getTurnaroundTime(process, now),
      vruntime: getVirtualRuntime(process, now)
    })
  }

  useEffect(() => {
    const interval = setInterval(updateMetrics, 100);
    return () => {
      clearInterval(interval);
    }
  }, [process])

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
            <Label>{formatMetric(metrics.vruntime)} / {process.duration.toFixed(1)}s</Label>
          </div>
          <Progress
            value={metrics.vruntime / process.duration * 1000}
          />
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-[12px]">
            <Badge className="bg-[var(--chart-2)]">
                Wait: {formatMetric(metrics.wait)}s
            </Badge>
            <Badge className="bg-[var(--chart-1)]">
                Response: {formatMetric(metrics.response)}s
            </Badge>
            <Badge className="bg-[var(--chart-5)]">
                Turnaround: {formatMetric(metrics.turnaround)}s
            </Badge>
        </CardFooter>
    </Card>
  );
};
