import { useEffect, useState } from "react";
import { type SchedulerController, type Process, Algorithm, SchedulerState, ProcessStatus } from "../types";
import { getVirtualRuntime } from "../utils";
import { minBy } from "lodash"

const PREEMPTIVE_ALGORITHMS : Array<Algorithm> = [
  Algorithm.SCTF,
  Algorithm.RR,
  Algorithm.CFS,
  Algorithm.DIY
]

export const useScheduler = (): SchedulerController => {
  const [state, setState] = useState<SchedulerState>(SchedulerState.PAUSED);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contextSwitchFrequency, setContextSwitchFrequency] = useState<number>(5);
  const [contextSwitchDuration, setContextSwitchDuration] = useState<number>(2);
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.FCFS);
  const [quizMode, setQuizMode] = useState<boolean>(false);

  const addProcess = (process: Process) => {
    setProcesses((ps) => [process, ...ps]);
    setState(SchedulerState.RUNNING)
  };

  const pause = () => {
    setState(SchedulerState.PAUSED);
  };

  const play = () => {
    setState(SchedulerState.RUNNING);
  };

  const reset = () => {
    setState(SchedulerState.PAUSED);
    setProcesses([]);
  };

  const schedule = (algorithm: Algorithm, processes: Array<Process>, now: number) : number | undefined => {
    const waitingProcesses = processes.filter(process => process.status === ProcessStatus.WAITING);
    switch(algorithm) {
      case Algorithm.SJF:
        return minBy(waitingProcesses, (p) => p.duration)?.pid
      case Algorithm.FCFS:
        return minBy(waitingProcesses, (p) => p.enquedAt)?.pid
      case Algorithm.RR:
        return undefined
      case Algorithm.CFS:
        return minBy(waitingProcesses, (p) => getVirtualRuntime(p, now))?.pid;
      case Algorithm.SCTF:
        return minBy(waitingProcesses, (p) => p.duration - getVirtualRuntime(p, now))?.pid;
      case Algorithm.DIY:
        return undefined;
    }
  }

  const contextSwitch = (now: number) => {
    const nextPid = schedule(algorithm, processes, now);
    setProcesses(p => p.map(process => {
      if(process.status === ProcessStatus.RUNNING) {
        const vruntime = getVirtualRuntime(process, now) / 1000;
        const isComplete = vruntime >= process.duration;

        return {
          ...process,
          status: isComplete ? ProcessStatus.COMPLETE : ProcessStatus.WAITING,
          completedAt: isComplete ? now : undefined
        }
      }
      if(process.pid === nextPid) {
        return {
          ...process,
          status: ProcessStatus.RUNNING
        }
      }
      return process
    }))
  }

  useEffect(() => {
    if(state === SchedulerState.RUNNING && PREEMPTIVE_ALGORITHMS.includes(algorithm)) {
      const interval = setInterval(contextSwitch, contextSwitchFrequency * 1000);

      return () => {
        clearInterval(interval);
      }
    }
  }, [state, contextSwitchFrequency])



  return {
    state,
    processes,
    addProcess,
    contextSwitchDuration,
    setContextSwitchDuration,
    contextSwitchFrequency,
    setContextSwitchFrequency,
    algorithm,
    setAlgorithm,
    pause,
    play,
    reset,
    quizMode,
    setQuizMode,
  };
};
