import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ProcessStatus, type Process } from "../types";
import { Badge } from "@/components/ui/badge";
import { ProcessCard } from "./ProcessCard";
import {
  formatMetric,
  getAverageResponse,
  getAverageTurnaround,
  getAverageWait,
  getCPUActive,
  getThroughput,
} from "../utils";

interface Props {
  processes: Array<Process>;
}

interface PerformanceMetrics {
  elapsed: number;
  cpuActive: number;
  throughput: number;
  wait: number;
  response: number;
  turnaround: number;
}

export const DirectExecution: React.FunctionComponent<Props> = ({ processes }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    elapsed: 0,
    cpuActive: 0,
    throughput: 0,
    wait: 0,
    response: 0,
    turnaround: 0,
  });

  const running = useMemo(
    () => processes.filter((p) => p.status === ProcessStatus.RUNNING),
    [processes]
  );

  const startTime = useMemo(() => {
    if (processes.length > 0) {
      return Math.min(...processes.map(({ enquedAt }) => enquedAt));
    }
    return undefined;
  }, [processes]);

  const getElapsed = useCallback(
    (now: number): number => {
      return startTime ? now - startTime : 0;
    },
    [startTime]
  );

  const updateMetrics = () => {
    const now = new Date().getTime();
    setMetrics({
      elapsed: getElapsed(now),
      cpuActive: getCPUActive(processes, now),
      throughput: getThroughput(processes),
      wait: getAverageWait(processes, now),
      response: getAverageResponse(processes, now),
      turnaround: getAverageTurnaround(processes, now),
    });
  };

  useEffect(() => {
    const interval = setInterval(updateMetrics, 100);

    return () => {
      clearInterval(interval);
    };
  }, [processes]);

  return (
    <div className="flex h-full w-full flex-col gap-[12px] p-[12px]">
      <div className="flex w-full justify-between">
        <h1 className="text-xl font-medium tracking-tight">Direct Execution</h1>
        <div className="flex flex-col gap-[12px]">
          <div className="flex w-[494px] justify-end gap-[12px]">
            <Badge>Elapsed: {formatMetric(metrics.elapsed)}s</Badge>
            <Badge variant={"secondary"}>CPU Active: {formatMetric(metrics.cpuActive)}s</Badge>
            <Badge variant={"outline"}>Throughput: {formatMetric(metrics.throughput)}s</Badge>
          </div>
          <div className="flex w-[494px] justify-end gap-[12px]">
            <Badge className="bg-[var(--chart-2)]">
              Average Wait: {formatMetric(metrics.wait)}s
            </Badge>
            <Badge className="bg-[var(--chart-1)]">
              Average Response: {formatMetric(metrics.response)}s
            </Badge>
            <Badge className="bg-[var(--chart-5)]">
              Average Turnaround: {formatMetric(metrics.turnaround)}s
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-[400px]">
          {running.map((process) => (
            <ProcessCard process={process} />
          ))}
        </div>
      </div>
    </div>
  );
};
