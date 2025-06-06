import { EventType, ProcessStatus, type Process } from "./types";

export const getWaitTime = (process: Process, now: number): number => {
  return (process.completedAt ?? now) - process.enquedAt - process.vruntime;
};

export const getTurnaroundTime = (process: Process, now: number): number => {
  return process.completedAt ?? now - process.enquedAt;
};

export const getResponseTime = (process: Process, now: number): number => {
  const firstRun = process.events.find((e) => e.type === EventType.EXECUTED)?.timestamp ?? now;
  return firstRun - process.enquedAt;
};

export const getCPUActive = (processes: Process[]): number => {
  return processes.reduce((total, process) => total + process.vruntime, 0);
};

export const getThroughput = (processes: Process[]): number => {
  return (
    processes.reduce(
      (total, p) => total + (p.status === ProcessStatus.COMPLETE ? p.duration : 0),
      0
    ) * 1000
  );
};

export const getAverageWait = (processes: Process[], now: number): number => {
  if (processes.length) {
    return (
      processes.reduce((total, process) => total + getWaitTime(process, now), 0) / processes.length
    );
  }
  return 0;
};

export const getAverageResponse = (processes: Process[], now: number): number => {
  if (processes.length) {
    return (
      processes.reduce((total, process) => total + getResponseTime(process, now), 0) /
      processes.length
    );
  }
  return 0;
};

export const getAverageTurnaround = (processes: Process[], now: number): number => {
  if (processes.length) {
    return (
      processes.reduce((total, process) => total + getTurnaroundTime(process, now), 0) /
      processes.length
    );
  }
  return 0;
};

export const formatMetric = (value: number): string => {
  return (value / 1000).toFixed(1);
};

export function partition<T>(data: T[], condition: (item: T) => boolean): [T[], T[]] {
  return data.reduce(
    ([yes, no], item) => {
      if (condition(item)) {
        return [[...yes, item], no];
      }
      return [yes, [...no, item]];
    },
    [[], []] as [T[], T[]]
  );
}
