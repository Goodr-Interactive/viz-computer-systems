import React, { useEffect, useMemo, useState } from "react";
import { ProcessStatus, type Process, Algorithm } from "../types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { formatMetric, getResponseTime, getTurnaroundTime, getWaitTime } from "../utils";

interface Props {
  algorithm: Algorithm;
  clock: number;
  process: Process;
}

type ProcessState = ["default" | "secondary" | "destructive" | "outline", string];

interface ProcessMetrics {
  wait: number;
  response: number;
  turnaround: number;
}

export const ProcessCard: React.FunctionComponent<Props> = ({ process, clock, algorithm }) => {
  const now = new Date().getTime();

  const [metrics, setMetrics] = useState<ProcessMetrics>({
    wait: getWaitTime(process, now),
    response: getResponseTime(process, now),
    turnaround: getTurnaroundTime(process, now),
  });

  const [variant, label]: ProcessState = useMemo(() => {
    switch (process.status) {
      case ProcessStatus.COMPLETE:
        return ["secondary", "Complete"];
      case ProcessStatus.RUNNING:
        return ["default", "Running"];
      case ProcessStatus.WAITING:
        return ["outline", "Waiting"];
    }
  }, [process.status]);

  useEffect(() => {
    setMetrics({
      wait: getWaitTime(process, clock),
      response: getResponseTime(process, clock),
      turnaround: getTurnaroundTime(process, clock),
    });
  }, [clock, process]);
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-[8px] items-center">
            <CardTitle>PID:{process.pid}</CardTitle>
            <CardDescription>– Arrived at: {(process.enquedAt / 1000).toFixed(1)}s</CardDescription>
          </div>
          
          <Badge variant={variant}>{label}</Badge>
        </div>

        
        <div className="mt-[8px] flex w-full justify-between">
          <Label>{algorithm === Algorithm.CFS ? "vruntime" : "time"}</Label>
          <Label>
            {formatMetric(process.vruntime)} /{" "}
            {process.unknownRuntime ? "?" : process.duration.toFixed(1)}s
          </Label>
        </div>
        <Progress value={process.vruntime / (process.duration * 10)} />
      </CardHeader>
      <CardFooter className="flex flex-wrap gap-[12px]">
        <Badge className="bg-[var(--chart-2)]">Wait: {formatMetric(metrics.wait)}s</Badge>
        <Badge className="bg-[var(--chart-1)]">Response: {formatMetric(metrics.response)}s</Badge>
        <Badge className="bg-[var(--chart-5)]">
          Turnaround: {formatMetric(metrics.turnaround)}s
        </Badge>
      </CardFooter>
    </Card>
  );
};
