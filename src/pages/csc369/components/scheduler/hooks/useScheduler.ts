import { useEffect, useState } from "react";
import {
  type SchedulerController,
  type Process,
  Algorithm,
  SchedulerState,
  ProcessStatus,
  EventType,
  PREEMPTIVE_ALGORITHMS,
} from "../types";
import { minBy, sampleSize, shuffle } from "lodash";
import { useQuizMode } from "./useQuizMode";

export const useScheduler = (allowedAlgorithms?: Algorithm[]): SchedulerController => {
  const [state, setState] = useState<SchedulerState>(SchedulerState.PAUSED);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contextSwitchFrequency, _setContextSwitchFrequency] = useState<number>(5);
  const [contextSwitchDuration, _setContextSwitchDuration] = useState<number>(2);
  const [algorithm, setAlgorithm] = useState<Algorithm>(allowedAlgorithms?.at(0) ?? Algorithm.FIFO);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [clock, setClock] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [contextSwitchTimes, setContextSwitchTimes] = useState<[number, number]>([
    0,
    contextSwitchDuration * 1000,
  ]);
  const [lastRun, setLastRun] = useState<Process>();
  const [nextRun, setNextRun] = useState<Process>();

  const setContextSwitchDuration = (csd: number) => {
    _setContextSwitchDuration(csd);
    setContextSwitchTimes(([start]) => [start, start + csd * 1000]);
  };

  const setContextSwitchFrequency = (csf: number) => {
    if (state !== SchedulerState.RUNNING) {
      _setContextSwitchFrequency(csf);
    }
  };
  const quiz = useQuizMode();

  const addProcess = (process: Process) => {
    setProcesses((ps) => [...ps, process]);
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
    setClock(0);
    setContextSwitchTimes([0, contextSwitchDuration * 1000]);
  };

  const skipForward = () => {};

  const skipBack = () => {};

  const running = processes.find((p) => p.status === ProcessStatus.RUNNING);

  const processUpdate = () => {
    setClock((c) => {
      const now = c + 100 * playbackSpeed;
      const [start, end] = contextSwitchTimes;

      c === 0 && initiateContextSwitch(now);

      if (end <= now) {
        completeContextSwitch(now);
      }

      if (now >= start && running) {
        initiateContextSwitch(now);
      }

      setProcesses((p) =>
        p.map((process) => ({
          ...process,
          vruntime:
            process.pid === running?.pid && process.vruntime < process.duration * 1000
              ? process.vruntime + 100 * playbackSpeed
              : process.vruntime,
        }))
      );
      return now;
    });
  };

  useEffect(() => {
    if (state === SchedulerState.RUNNING) {
      const interval = setInterval(processUpdate, 100);
      return () => {
        clearInterval(interval);
      };
    }
  }, [state, running]);

  const nextProcess = (algorithm: Algorithm, processes: Process[]): Process | undefined => {
    const waitingProcesses = processes.filter(
      (process) => process.status === ProcessStatus.WAITING
    );
    switch (algorithm) {
      case Algorithm.SJF:
        return minBy(waitingProcesses, (p) => p.duration);
      case Algorithm.FIFO:
        return minBy(waitingProcesses, (p) => p.enquedAt);
      case Algorithm.RR:
        const greaterPids = waitingProcesses.filter(({ pid }) => pid > (lastRun?.pid ?? 0));
        return minBy(greaterPids.length ? greaterPids : waitingProcesses, (p) => p.pid);
      case Algorithm.CFS:
        return minBy(waitingProcesses, (p) => p.vruntime);
      case Algorithm.SCTF:
        return minBy(waitingProcesses, (p) => p.duration - p.vruntime);
    }
  };

  const suspend = (pid: number, now: number) => {
    setProcesses((p) =>
      p.map((process) => {
        if (process.pid === pid && process.status === ProcessStatus.RUNNING) {
          const isComplete = willComplete(process);
          return {
            ...process,
            vruntime: isComplete ? process.duration * 1000 : process.vruntime,
            status: isComplete ? ProcessStatus.COMPLETE : ProcessStatus.WAITING,
            completedAt: isComplete ? now : undefined,
            events: [
              ...process.events,
              {
                type: EventType.SUSPENDED,
                timestamp: now,
              },
            ],
          };
        }
        return process;
      })
    );
  };

  const execute = (pid: number, now: number) => {
    setProcesses((p) =>
      p.map((process) => {
        if (process.pid === pid) {
          return {
            ...process,
            status: ProcessStatus.RUNNING,
            events: [
              ...process.events,
              {
                type: EventType.EXECUTED,
                timestamp: now,
              },
            ],
          };
        }
        return process;
      })
    );
  };

  const willComplete = (process: Process) => {
    const vruntime = (process.vruntime + 100) / 1000;
    return vruntime >= process.duration;
  };

  const completeContextSwitch = (now: number) => {
    const next =
      nextProcess(
        algorithm,
        processes.filter(({ pid }) => pid !== lastRun?.pid)
      ) ?? (lastRun && !willComplete(lastRun) ? lastRun : undefined);
    if (next) {
      execute(next.pid, now);
      const processEndTime = now + next.duration * 1000 - next.vruntime + 100;
      if (
        PREEMPTIVE_ALGORITHMS.includes(algorithm) &&
        processes.filter(({ status }) => status === ProcessStatus.WAITING).length
      ) {
        const csAt = now + contextSwitchFrequency * 1000;
        const csStart = Math.min(processEndTime, csAt);
        setContextSwitchTimes([csStart, csStart + contextSwitchDuration * 1000]);
      } else {
        setContextSwitchTimes([processEndTime, processEndTime + contextSwitchDuration * 1000]);
      }
    }
  };

  const initiateContextSwitch = (now: number) => {
    if (running) {
      setLastRun(running);
      suspend(running.pid, now);
    }
    const next =
      nextProcess(
        algorithm,
        processes.filter(({ pid }) => pid !== running?.pid)
      ) ?? (running && !willComplete(running) ? running : undefined);
    setNextRun(next);
    const waitingProcesses = processes.filter(
      (process) => process.status === ProcessStatus.WAITING && process.pid !== next?.pid
    );
    if (next) {
      if (quizMode && waitingProcesses.length >= 1) {
        pause();
        quiz.setQuestion({
          correct: next.pid,
          options: shuffle([
            ...sampleSize(waitingProcesses, Math.min(waitingProcesses.length, 4)).map((p) => p.pid),
            next.pid,
          ]),
        });
      }
    } else {
      pause();
    }
  };

  return {
    state,
    clock,
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
    skipForward,
    skipBack,
    quizMode,
    setQuizMode,
    playbackSpeed,
    setPlaybackSpeed,
    quiz,
    contextSwitchTimes,
    lastRun,
    nextRun,
  };
};
