import React, { useEffect, useMemo, useState } from "react";
import { ProcessStatus, type SchedulerController } from "../types";
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
import { QuizDisplay } from "./QuizDisplay";
import { PerformanceChart } from "./PerformanceChart";

interface Props {
  controller: SchedulerController;
}

interface PerformanceMetrics {
  elapsed: number;
  cpuActive: number;
  throughput: number;
  wait: number;
  response: number;
  turnaround: number;
}

export const DirectExecution: React.FunctionComponent<Props> = ({ controller }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    elapsed: 0,
    cpuActive: 0,
    throughput: 0,
    wait: 0,
    response: 0,
    turnaround: 0,
  });

  const running = useMemo(
    () => controller.processes.filter((p) => p.status === ProcessStatus.RUNNING),
    [controller.processes]
  );

  useEffect(() => {
    setMetrics({
      elapsed: controller.clock,
      cpuActive: getCPUActive(controller.processes),
      throughput: getThroughput(controller.processes),
      wait: getAverageWait(controller.processes, controller.clock),
      response: getAverageResponse(controller.processes, controller.clock),
      turnaround: getAverageTurnaround(controller.processes, controller.clock),
    });
  }, [controller.clock, controller.processes]);

  const [csStart, csEnd] = controller.contextSwitchTimes;

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

        {controller.processes.length && controller.processes.every(p => p.completedAt) ? (
          <PerformanceChart 
            processes={controller.processes}
            clock={controller.clock}
          />
        ) : controller.quiz.question ? (
          <QuizDisplay question={controller.quiz.question} controller={controller} />
        ) : (
          <div className="w-[400px]">
            {running.length ? (
              running.map((process) => (
                <ProcessCard
                  key={process.pid}
                  process={process}
                  algorithm={controller.algorithm}
                  clock={controller.clock}
                />
              ))
            ) : csStart < controller.clock ? (
              <div>
                <span>
                  Context Switch...{((csEnd - controller.clock) / 1000).toFixed(1)}s/
                  {controller.contextSwitchDuration}s
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
