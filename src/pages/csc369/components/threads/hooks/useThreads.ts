import { useEffect, useMemo, useState } from "react";
import {
  CRITICAL_SECTION_COLORS,
  LOCK_COLORS,
  ThreadAction,
  type Lock,
  type LockState,
  type MutualExclusionViolation,
  type Semaphore,
  type SemaphoreState,
  type Thread,
  type ThreadEvent,
  type ThreadsController,
  type ThreadState,
} from "../types";

export const useThreads = (
  threads: Thread[],
  locks: Lock[],
  semaphores: Semaphore[]
): ThreadsController => {
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

  const criticalSectionIds = new Set(
    threads.flatMap(({ criticalSections }) => criticalSections.map(({ id }) => id))
  );

  const colors: Record<string, string> = Object.fromEntries([
    ...locks.map(({ id }, index) => [id, LOCK_COLORS[index % LOCK_COLORS.length]]),
    ...Array.from(criticalSectionIds).map((id, index) => [
      id,
      CRITICAL_SECTION_COLORS[index % CRITICAL_SECTION_COLORS.length],
    ]),
  ]);

  const [events, setEvents] = useState<ThreadEvent[]>([]);

  const [running, setRunning] = useState<Thread>();

  const isWaiting = (thread: Thread): boolean => {
    return (
      Object.values(lockState).some((ts) => ts.waiting.includes(thread.id)) ||
      Object.values(semaphoreState).some((sem) => sem.waiting.includes(thread.id))
    );
  };

  const updateLocks = (thread: Thread, step: number) => {
    const acquire = thread.locks.find((lock) => lock.acquireAt === step);
    if (acquire) {
      if (lockState[acquire.id].heldBy === undefined) {
        setEvents((e) => [
          ...e,
          {
            threadId: thread.id,
            timeStep: step,
            action: ThreadAction.LOCK_ACQUIRE,
            resourceId: acquire.id,
          },
        ]);
        setLockState((ls) => ({
          ...ls,
          [acquire.id]: {
            ...(lockState[acquire.id] ?? { waiting: [] }),
            heldBy: thread.id,
            waiting: lockState[acquire.id]?.waiting.filter((id) => id !== thread.id) ?? [],
          },
        }));
      } else if (!lockState[acquire.id].waiting.includes(thread.id)) {
        setEvents((e) => [
          ...e,
          {
            threadId: thread.id,
            timeStep: step,
            action: ThreadAction.LOCK_WAIT,
            resourceId: acquire.id,
          },
        ]);
        setLockState((ls) => ({
          ...ls,
          [acquire.id]: {
            ...(lockState[acquire.id] ?? { waiting: [] }),
            waiting: [...(lockState[acquire.id]?.waiting ?? []), thread.id],
          },
        }));
      }
    }
    const release = thread.locks.find((lock) => lock.releaseAt === step);
    if (release) {
      if (lockState[release.id].heldBy === thread.id) {
        setEvents((e) => [
          ...e,
          {
            threadId: thread.id,
            timeStep: step,
            action: ThreadAction.LOCK_RELEASE,
            resourceId: release.id,
          },
        ]);
        setLockState((ls) => ({
          ...ls,
          [release.id]: {
            ...(lockState[release.id] ?? { waiting: [] }),
            heldBy: undefined,
          },
        }));
      }
    }
  };

  const updateCriticalSections = (thread: Thread, step: number) => {
    const entered = thread.criticalSections.find((cs) => cs.startAt + 1 === step);
    if (entered) {
      setEvents((e) => [
        ...e,
        {
          threadId: thread.id,
          timeStep: step,
          action: ThreadAction.CRITICAL_SECTION_ENTER,
          resourceId: entered.id,
        },
      ]);
    }
    const exited = thread.criticalSections.find((cs) => cs.endAt - 1 === step);
    if (exited) {
      setEvents((e) => [
        ...e,
        {
          threadId: thread.id,
          timeStep: step,
          action: ThreadAction.CRITICAL_SECTION_EXIT,
          resourceId: exited.id,
        },
      ]);
    }
  };

  const update = (thread: Thread) => {
    setThreadState((ts) => {
      const timeStep = ts[thread.id]?.timeStep;
      if (timeStep !== undefined) {
        const step = timeStep + Number(!isWaiting(thread));

        updateLocks(thread, step);
        updateCriticalSections(thread, step);

        return {
          ...ts,
          [thread.id]: {
            timeStep: step,
          },
        };
      }
      return ts;
    });
  };

  const step = (thread: Thread) => {
    update(thread);
  };

  const runThread = (thread?: Thread) => {
    setRunning(thread);
  };

  useEffect(() => {
    if (running) {
      const interval = setInterval(() => update(running), 100 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [running, playbackSpeed, lockState, semaphoreState]);

  const reset = () => {
    setLockState(
      Object.fromEntries(locks.map((lock) => [lock.id, { heldBy: undefined, waiting: [] }]))
    );

    setSemaphoreState(
      Object.fromEntries(semaphores.map((s) => [s.id, { heldBy: [], waiting: [] }]))
    );

    setThreadState(Object.fromEntries(threads.map(({ id }) => [id, { timeStep: 0 }])));

    setEvents([]);
  };

  const mutualExclusionViolations: MutualExclusionViolation[] = useMemo(() => {
    return [];
  }, [threads, threadState]);

  return {
    runThread,
    reset,
    setPlaybackSpeed,
    threadState,
    playbackSpeed,
    mutualExclusionViolations,
    threads,
    locks,
    events,
    semaphores,
    running,
    colors,
    step,
  };
};
