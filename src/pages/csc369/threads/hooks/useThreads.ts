import { useEffect, useMemo, useState } from "react";
import type { Lock, LockState, MutualExclusionViolation, Semaphore, SemaphoreState, Thread, ThreadEvent, ThreadsController, ThreadState } from "../types";

export const useThreads = (
  threads: Array<Thread>,
  locks: Array<Lock>,
  semaphores: Array<Semaphore>
) : ThreadsController => {
  const accessedResourceIds = useMemo(
    () =>
      threads.flatMap((thread) => [
        ...thread.locks.map(({ id }) => id),
        ...thread.semaphores.map(({ id }) => id),
      ]),
    [threads]
  );

  const resourceIds = useMemo(
    () => [...locks.map(({ id }) => id), ...semaphores.map(({ id }) => id)],
    [locks, semaphores]
  );

  if (accessedResourceIds.some((id) => !resourceIds.includes(id))) {
    throw new Error("Invalid Resource id");
  }

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const [lockState, setLockState] = useState<Record<string, LockState>>(
    Object.fromEntries(locks.map((lock) => [lock.id, { heldBy: undefined, waiting: [] }]))
  );

  const [semaphoreState, setSemaphoreState] = useState<Record<string, SemaphoreState>>(
    Object.fromEntries(semaphores.map((s) => [s.id, { heldBy: [], waiting: [] }]))
  );

  const [threadState, setThreadState] = useState<Record<string, ThreadState>>(
    Object.fromEntries(threads.map(({ id }) => [id, { timeStep: 0 }]))
  );

  const [events, setEvents] = useState<Array<ThreadEvent>>([]);

  const [running, setRunning] = useState<Thread>();

  const isWaiting = (thread: Thread) : boolean => {
    return Object.values(lockState).some(ts => ts.waiting.includes(thread.id)) || Object.values(semaphoreState).some(sem => sem.waiting.includes(thread.id))
  }

  const update = (thread: Thread) => {
    setThreadState((ts) => {
      const timeStep = ts[thread.id]?.timeStep;
      if (timeStep !== undefined) {
        return {
          ...ts,
          [thread.id]: {
            timeStep: timeStep + Number(!isWaiting(thread)),
          },
        };
      }
      return ts;
    });
  };

  const runThread = (thread?: Thread) => {
    setRunning(thread);
  }

  useEffect(() => {
    if (running) {
      const interval = setInterval(() => update(running), 100 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [running, playbackSpeed]);

  const reset = () => {

  }

  const mutualExclusionViolations : Array<MutualExclusionViolation> = useMemo(() => {
    return []
  }, [threads, threadState]);


  return {
    runThread,
    reset,
    setPlaybackSpeed,
    playbackSpeed,
    mutualExclusionViolations,
    threads,
    locks,
    events,
    semaphores,
    running
  }
};
