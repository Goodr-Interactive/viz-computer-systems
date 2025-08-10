import { useEffect, useMemo, useState } from "react";
import {
  CRITICAL_SECTION_COLORS,
  CV_COLORS,
  LOCK_COLORS,
  SEM_COLORS,
  ThreadAction,
  type ConditionVariable,
  type ConditionVariableState,
  type Lock,
  type LockState,
  type MutualExclusionViolation,
  type Semaphore,
  type SemaphoreState,
  type State,
  type StateContext,
  type Thread,
  type ThreadEvent,
  type ThreadsController,
  type ThreadState,
} from "../types";

export const useThreads = (
  threads: Thread[],
  locks: Lock[],
  semaphores: Semaphore[],
  conditionVariables: ConditionVariable[],
  initialState: StateContext[]
): ThreadsController => {
  const accessedResourceIds = useMemo(
    () =>
      threads.flatMap((thread) => [
        ...(thread.locks?.map(({ id }) => id) ?? []),
        ...(thread.semaphores?.map(({ id }) => id) ?? []),
        ...(thread.conditionVariables?.map(({ id }) => id) ?? []),
      ]),
    [threads]
  );

  const resourceIds = useMemo(
    () => [
      ...locks.map(({ id }) => id),
      ...semaphores.map(({ id }) => id),
      ...conditionVariables.map(({ id }) => id),
    ],
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
    Object.fromEntries(semaphores.map((s) => [s.id, { count: s.initial, waiting: [] }]))
  );

  const [threadState, setThreadState] = useState<Record<string, ThreadState>>(
    Object.fromEntries(threads.map(({ id }) => [id, { timeStep: 0 }]))
  );

  const [conditionVariableState, setConditionVariableState] = useState<
    Record<string, ConditionVariableState>
  >(
    Object.fromEntries(
      conditionVariables.map(({ id, stateId, condition }) => [
        id,
        { stateId, condition, waiting: [] },
      ])
    )
  );

  const [state, setState] = useState<Record<string, State>>(
    Object.fromEntries(initialState.map(({ id, initial }) => [id, { id, value: initial }]))
  );

  const criticalSectionIds = new Set(
    threads.flatMap(({ criticalSections }) => criticalSections?.map(({ id }) => id) ?? [])
  );

  const colors: Record<string, string> = Object.fromEntries([
    ...locks.map(({ id }, index) => [id, LOCK_COLORS[index % LOCK_COLORS.length]]),
    ...semaphores.map(({ id }, index) => [id, SEM_COLORS[index % SEM_COLORS.length]]),
    ...conditionVariables.map(({ id }, index) => [id, CV_COLORS[index % CV_COLORS.length]]),
    ...Array.from(criticalSectionIds).map((id, index) => [
      id,
      CRITICAL_SECTION_COLORS[index % CRITICAL_SECTION_COLORS.length],
    ]),
  ]);

  const [events, setEvents] = useState<ThreadEvent[]>([]);
  const [blockingEvent, setBlockingEvent] = useState<ThreadEvent>();
  const [running, setRunning] = useState<Thread>();

  const isWaiting = (thread: Thread): boolean => {
    return (
      Object.values(lockState).some((ts) => ts.waiting.includes(thread.id)) ||
      Object.values(semaphoreState).some((sem) => sem.waiting.includes(thread.id)) ||
      Object.values(conditionVariableState).some((cv) => cv.waiting.includes(thread.id))
    );
  };

  const canRun = (thread: Thread): boolean => {
    return (
      Object.values(lockState).every(
        (ts) => !ts.waiting.includes(thread.id) || ts.heldBy === undefined
      ) &&
      Object.values(semaphoreState).every((sem) => !sem.waiting.includes(thread.id)) &&
      Object.values(conditionVariableState).every((cv) => !cv.waiting.includes(thread.id))
    );
  };

  const addEvent = (event: ThreadEvent) => {
    if (event.onComplete) {
      setBlockingEvent(event);
      setRunning(undefined);
    } else {
      setEvents((e) => [...e, event]);
    }
  };

  const unblockEvent = () => {
    if (blockingEvent) {
      blockingEvent.onComplete?.();
      setEvents((e) => [...e, blockingEvent]);
      setBlockingEvent(undefined);
    }
  };

  const updateSemaphores = (thread: Thread, step: number) => {
    const post = thread.semaphores?.find(({ posts }) => posts.includes(step));

    const wait = thread.semaphores?.find(({ waits }) => waits.includes(step));

    if (post) {
      const id = post.id;
      const wake = semaphoreState[id]?.waiting.at(0);
      setSemaphoreState((s) => ({
        ...s,
        [id]: {
          ...s[id],
          count: (s[id]?.count ?? 0) + 1,
          waiting: s[id]?.waiting.filter((waiting) => waiting !== wake),
        },
      }));
      addEvent({
        threadId: thread.id,
        timeStep: step,
        action: ThreadAction.SEM_POST,
        resourceId: id,
        onComplete: () => {
          const wakeThread = threads.find((thread) => thread.id === wake);
          setRunning(wakeThread ?? thread);
        },
      });
    }
    if (wait) {
      const id = wait.id;
      if (semaphoreState[id]?.count <= 0) {
        if (!semaphoreState[id]?.waiting.includes(thread.id)) {
          addEvent({
            threadId: thread.id,
            timeStep: step,
            action: ThreadAction.SEM_WAIT,
            resourceId: id,
          });
          setSemaphoreState((s) => ({
            ...s,
            [id]: {
              count: (s[id]?.count ?? 0) - 1,
              waiting: [...s[id].waiting, thread.id],
            },
          }));
        }
      } else {
        addEvent({
          threadId: thread.id,
          timeStep: step,
          action: ThreadAction.SEM_PASS,
          resourceId: id,
          onComplete: () => {
            setRunning(thread);
          },
        });
        setSemaphoreState((s) => ({
          ...s,
          [id]: {
            count: (s[id]?.count ?? 0) - 1,
            waiting: (s[id]?.waiting ?? []).filter((waiting) => waiting !== thread.id),
          },
        }));
      }
    }
  };

  const updateConditionVariables = (thread: Thread, step: number) => {
    const signal = thread.conditionVariables?.find(({ signals }) => signals.includes(step));

    const wait = thread.conditionVariables?.find(({ waits }) => waits.includes(step));

    if (signal) {
      const id = signal.id;
      const wake = conditionVariableState[id]?.waiting.at(0);
      const lock = Object.entries(lockState).find(([_, ls]) => ls.heldBy === thread.id);
      addEvent({
        threadId: thread.id,
        timeStep: step,
        action: ThreadAction.CV_SIGNAL,
        resourceId: id,
        onComplete: () => {
          setConditionVariableState((s) => ({
            ...s,
            [id]: {
              ...s[id],
              waiting: s[id]?.waiting.filter((waiting) => waiting !== wake),
            },
          }));

          if (lock && wake) {
            const [lockId, lockState] = lock;
            setLockState((ls) => ({
              ...ls,
              [lockId]: {
                ...lockState,
                waiting: [...lockState.waiting, wake],
              },
            }));
            addEvent({
              threadId: wake,
              timeStep: step,
              action: ThreadAction.LOCK_WAIT,
              resourceId: lockId,
            });
          }
          setRunning(thread);
        },
      });
    }
    if (wait) {
      const id = wait.id;
      if (!conditionVariableState[id]?.waiting.includes(thread.id)) {
        if (
          conditionVariableState[id] &&
          conditionVariableState[id].condition(state[conditionVariableState[id].stateId].value)
        ) {
          const lock = Object.entries(lockState).find(([_, ls]) => ls.heldBy === thread.id);
          addEvent({
            threadId: thread.id,
            timeStep: step,
            action: ThreadAction.CV_WAIT,
            resourceId: id,
            secondaryAction: ThreadAction.LOCK_RELEASE,
            secondaryResourceId: lock?.[0],
            onComplete: () => {
              setConditionVariableState((s) => ({
                ...s,
                [id]: {
                  ...s[id],
                  waiting: [...s[id].waiting, thread.id],
                },
              }));
              if (lock) {
                const [lockId, lockState] = lock;
                setLockState((ls) => ({
                  ...ls,
                  [lockId]: {
                    ...lockState,
                    heldBy: undefined,
                  },
                }));
              }
            },
          });
        } else {
          const lock = Object.entries(lockState).find(
            ([_, ls]) => ls.heldBy === undefined && ls.waiting.includes(thread.id)
          );
          if (lock) {
            const [lockId, state] = lock;
            addEvent({
              threadId: thread.id,
              timeStep: step,
              action: ThreadAction.LOCK_ACQUIRE,
              resourceId: lockId,
              onComplete: () => {
                setLockState((ls) => ({
                  ...ls,
                  [lockId]: {
                    ...state,
                    heldBy: thread.id,
                    waiting: lockState[lockId]?.waiting.filter((id) => id !== thread.id) ?? [],
                  },
                }));
                setRunning(thread);
              },
            });
          } else {
            addEvent({
              threadId: thread.id,
              timeStep: step,
              action: ThreadAction.CV_SKIP,
              resourceId: id,
              onComplete: () => {
                setRunning(thread);
              },
            });
          }
        }
      }
    }
  };

  const updateLocks = (thread: Thread, step: number) => {
    const acquire = thread.locks?.find((lock) => lock.acquireAt === step);
    if (acquire) {
      if (lockState[acquire.id].heldBy === undefined) {
        addEvent({
          threadId: thread.id,
          timeStep: step,
          action: ThreadAction.LOCK_ACQUIRE,
          resourceId: acquire.id,
          onComplete: () => {
            setLockState((ls) => ({
              ...ls,
              [acquire.id]: {
                ...(lockState[acquire.id] ?? { waiting: [] }),
                heldBy: thread.id,
                waiting: lockState[acquire.id]?.waiting.filter((id) => id !== thread.id) ?? [],
              },
            }));
            setRunning(thread);
          },
        });
      } else if (!lockState[acquire.id].waiting.includes(thread.id)) {
        addEvent({
          threadId: thread.id,
          timeStep: step,
          action: ThreadAction.LOCK_WAIT,
          resourceId: acquire.id,
        });
        setLockState((ls) => ({
          ...ls,
          [acquire.id]: {
            ...(lockState[acquire.id] ?? { waiting: [] }),
            waiting: [...(lockState[acquire.id]?.waiting ?? []), thread.id],
          },
        }));
      }
    }
    const release = thread.locks?.find((lock) => lock.releaseAt === step);
    if (release) {
      addEvent({
        threadId: thread.id,
        timeStep: step,
        action: ThreadAction.LOCK_RELEASE,
        resourceId: release.id,
        onComplete: () => {
          setLockState((ls) => ({
            ...ls,
            [release.id]: {
              ...(lockState[release.id] ?? { waiting: [] }),
              heldBy:
                lockState[release.id].heldBy === thread.id
                  ? undefined
                  : lockState[release.id].heldBy,
            },
          }));
          // setLockState((ls) => ({
          //   ...ls,
          //   [release.id]: {
          //     waiting:
          //       lockState[release.id].heldBy === thread.id
          //         ? (lockState[release.id]?.waiting.slice(1) ?? [])
          //         : [],
          //     heldBy:
          //       lockState[release.id].heldBy === thread.id
          //         ? lockState[release.id]?.waiting[0]
          //         : lockState[release.id].heldBy,
          //   },
          // }));
          setRunning(thread);
        },
      });
    }
  };

  const updateCriticalSections = (thread: Thread, step: number) => {
    const entered = thread.criticalSections?.find((cs) => cs.startAt + 1 === step);
    if (entered) {
      addEvent({
        threadId: thread.id,
        timeStep: step,
        action: ThreadAction.CRITICAL_SECTION_ENTER,
        resourceId: entered.id,
      });
    }
    const exited = thread.criticalSections?.find((cs) => cs.endAt - 1 === step);
    if (exited) {
      if (exited.action) {
        setState((s) => ({
          ...s,
          [exited.action!.stateId]: {
            id: exited.action!.stateId,
            value: exited.action!.action(s[exited.action!.stateId]!.value),
          },
        }));
      }
      addEvent({
        threadId: thread.id,
        timeStep: step,
        action: ThreadAction.CRITICAL_SECTION_EXIT,
        resourceId: exited.id,
      });
    }
  };

  const update = (thread: Thread) => {
    setThreadState((ts) => {
      const timeStep = ts[thread.id]?.timeStep;
      if (timeStep !== undefined) {
        const step = Math.min(timeStep + Number(!isWaiting(thread)), thread.timeSteps);

        updateLocks(thread, step);
        updateConditionVariables(thread, step);
        updateSemaphores(thread, step);
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
      const interval = setInterval(() => update(running), 50 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [running, playbackSpeed, lockState, semaphoreState, conditionVariableState]);

  const reset = () => {
    setLockState(
      Object.fromEntries(locks.map((lock) => [lock.id, { heldBy: undefined, waiting: [] }]))
    );

    setSemaphoreState(
      Object.fromEntries(semaphores.map((s) => [s.id, { count: s.initial, waiting: [] }]))
    );

    setConditionVariableState(
      Object.fromEntries(
        conditionVariables.map((cv) => [
          cv.id,
          { waiting: [], condition: cv.condition, stateId: cv.stateId, conditionStr: cv },
        ])
      )
    );

    setThreadState(Object.fromEntries(threads.map(({ id }) => [id, { timeStep: 0 }])));

    setEvents([]);
    setBlockingEvent(undefined);
    setRunning(undefined);
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
    lockState,
    semaphoreState,
    conditionVariables,
    conditionVariableState,
    blockingEvent,
    unblockEvent,
    canRun,
    isWaiting,
    state,
  };
};
