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

export const READER_WRITER: ThreadsProps = {
  title: "Reader & Writer",
  description:
    "The following threads example uses Semaphores to manage access to a message queue.",
  threads: [
    {
      id: "Writer",
      timeSteps: 500,
      locks: [],
      criticalSections: [
        {
          id: "Write",
          startAt: 50,
          endAt: 100,
        },
        {
          id: "Write",
          startAt: 200,
          endAt: 250,
        },
        {
          id: "Write",
          startAt: 350,
          endAt: 400,
        },
      ],
      semaphores: [
        {
          id: "Semaphore",
          posts: [100, 250, 400],
          waits: []
        }
      ],
    },
    {
      id: "Reader",
      timeSteps: 500,
      locks: [],
      criticalSections: [
        {
          id: "Read",
          startAt: 40,
          endAt: 90,
        },
        {
          id: "Read",
          startAt: 210,
          endAt: 260,
        },
        {
          id: "Read",
          startAt: 340,
          endAt: 390,
        },
      ],
      semaphores: [
        {
          id: "Semaphore",
          posts: [],
          waits: [40, 210, 340]
        }
      ],
    },
  ],
  locks: [],
  semaphores: [
    {
      id: "Semaphore",
      initial: 0
    }
  ],
};

export const MULTI_READER_WRITER: ThreadsProps = {
  title: "Multiple Reader & Single Writer",
  description:
    "The following threads example uses Semaphores to manage access to a message queue.",
  threads: [
    {
      id: "Writer",
      timeSteps: 500,
      locks: [],
      criticalSections: [
        {
          id: "Write",
          startAt: 50,
          endAt: 75,
        },
        {
          id: "Write",
          startAt: 150,
          endAt: 175,
        },
        {
          id: "Write",
          startAt: 250,
          endAt: 275,
        },
        {
          id: "Write",
          startAt: 350,
          endAt: 375,
        },
      ],
      semaphores: [
        {
          id: "Semaphore",
          posts: [75, 175, 275, 375],
          waits: []
        }
      ],
    },
    {
      id: "Reader 1",
      timeSteps: 500,
      locks: [],
      criticalSections: [
        {
          id: "Read",
          startAt: 30,
          endAt: 60,
        },
        {
          id: "Read",
          startAt: 210,
          endAt: 240,
        },
        {
          id: "Read",
          startAt: 360,
          endAt: 390,
        },
      ],
      semaphores: [
        {
          id: "Semaphore",
          posts: [],
          waits: [30, 210, 360]
        }
      ],
    },

    {
      id: "Reader 2",
      timeSteps: 500,
      locks: [],
      criticalSections: [
        {
          id: "Read",
          startAt: 130,
          endAt: 160,
        },
        {
          id: "Read",
          startAt: 310,
          endAt: 340,
        },
      ],
      semaphores: [
        {
          id: "Semaphore",
          posts: [],
          waits: [130, 310]
        }
      ],
    },
  ],
  locks: [],
  semaphores: [
    {
      id: "Semaphore",
      initial: 0
    }
  ],
};
