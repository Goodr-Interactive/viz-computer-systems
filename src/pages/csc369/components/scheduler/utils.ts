import { EventType, ProcessStatus, type Process } from "./types";

export const getWaitTime = (process: Process, now: number): number => {
  return 0;
};

export const getTurnaroundTime = (process: Process, now: number): number => {
  return process.completedAt ?? now - process.enquedAt;
};

export const getResponseTime = (process: Process, now: number): number => {
  const firstRun = process.events.find((e) => e.type === EventType.EXECUTED)?.timestamp ?? now;
  return firstRun - process.enquedAt;
};

export const getVirtualRuntime = (process: Process, now: number): number => {
  return 0;
};

export const getCPUActive = (processes: Array<Process>, now: number): number => {
  return processes.reduce((total, process) => total + getVirtualRuntime(process, now), 0);
};

export const getThroughput = (processes: Array<Process>): number => {
  return processes.reduce(
    (total, p) => (total + p.status === ProcessStatus.COMPLETE ? p.duration : 0),
    0
  );
};

export const getAverageWait = (processes: Array<Process>, now: number): number => {
  if (processes.length) {
    return (
      processes.reduce((total, process) => total + getWaitTime(process, now), 0) / processes.length
    );
  }
  return 0;
};

export const getAverageResponse = (processes: Array<Process>, now: number): number => {
  if (processes.length) {
    return (
      processes.reduce((total, process) => total + getResponseTime(process, now), 0) /
      processes.length
    );
  }
  return 0;
};

export const getAverageTurnaround = (processes: Array<Process>, now: number): number => {
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

export function partition<T>(
  data: Array<T>,
  condition: (item: T) => boolean
): [Array<T>, Array<T>] {
  return data.reduce(
    ([yes, no], item) => {
      if (condition(item)) {
        return [[...yes, item], no];
      }
      return [yes, [...no, item]];
    },
    [[], []] as [Array<T>, Array<T>]
  );
}
