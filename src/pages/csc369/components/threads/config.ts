import type { ThreadsProps } from "./Threads";

export const SIMPLE_MUTEX: ThreadsProps = {
  title: "Mutual Exclusion",
  description:
    "The following threads example enforces mutual exclusion using Locks, run the threads in any order and observe that mutual exclusion is never violated",
  threads: [
    {
      id: "Thread 1",
      timeSteps: 1000,
      locks: [
        {
          id: "Lock 1",
          acquireAt: 100,
          releaseAt: 250,
        },
        {
          id: "Lock 2",
          acquireAt: 500,
          releaseAt: 700,
        },
      ],
      criticalSections: [
        {
          id: "Critical Section 1",
          startAt: 100,
          endAt: 250,
        },
        {
          id: "Critical Section 2",
          startAt: 500,
          endAt: 700,
        },
      ],
      semaphores: [],
    },
    {
      id: "Thread 2",
      timeSteps: 1000,
      locks: [
        {
          id: "Lock 1",
          acquireAt: 150,
          releaseAt: 400,
        },
        {
          id: "Lock 2",
          acquireAt: 450,
          releaseAt: 600,
        },
      ],
      criticalSections: [
        {
          id: "Critical Section 1",
          startAt: 150,
          endAt: 400,
        },
        {
          id: "Critical Section 2",
          startAt: 450,
          endAt: 600,
        },
      ],
      semaphores: [],
    },
  ],
  locks: [
    {
      id: "Lock 1",
    },
    {
      id: "Lock 2",
    },
  ],
  semaphores: [],
};

export const DEADLOCK: ThreadsProps = {
  title: "Deadlock",
  description:
    "The following threads example can result in a Deadlock, run the threads to try to create this Deadlock",
  threads: [
    {
      id: "Thread 1",
      timeSteps: 1000,
      locks: [
        {
          id: "Lock 2",
          acquireAt: 100,
          releaseAt: 850,
        },
        {
          id: "Lock 1",
          acquireAt: 250,
          releaseAt: 600,
        },
      ],
      criticalSections: [
        {
          id: "Critical Section 2",
          startAt: 100,
          endAt: 850,
        },
        {
          id: "Critical Section 1",
          startAt: 250,
          endAt: 600,
        },
      ],
      semaphores: [],
    },
    {
      id: "Thread 2",
      timeSteps: 1000,
      locks: [
        {
          id: "Lock 1",
          acquireAt: 150,
          releaseAt: 900,
        },
        {
          id: "Lock 2",
          acquireAt: 300,
          releaseAt: 700,
        },
      ],
      criticalSections: [
        {
          id: "Critical Section 1",
          startAt: 150,
          endAt: 900,
        },
        {
          id: "Critical Section 2",
          startAt: 300,
          endAt: 700,
        },
      ],
      semaphores: [],
    },
  ],
  locks: [
    {
      id: "Lock 1",
    },
    {
      id: "Lock 2",
    },
  ],
  semaphores: [],
};
