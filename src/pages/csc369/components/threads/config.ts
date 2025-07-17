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
};

export const PRODUCER_CONSUMER: ThreadsProps = {
  title: "Producer & Consumer – Semaphores",
  description:
    "The following threads example uses Semaphores to manage access to a bounded Buffer/Queue.",
  threads: [
    {
      id: "Producer",
      timeSteps: 500,
      criticalSections: [
        {
          id: "put(i);",
          startAt: 50,
          endAt: 100,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
        {
          id: "put(i);",
          startAt: 200,
          endAt: 250,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
        {
          id: "put(i);",
          startAt: 350,
          endAt: 400,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
      ],
      semaphores: [
        {
          id: "full",
          posts: [115, 265, 415],
          waits: [],
        },
        {
          id: "empty",
          posts: [],
          waits: [35, 185, 335],
        },
        {
          id: "mutex",
          posts: [100, 250, 400],
          waits: [50, 200, 350],
        },
      ],
    },
    {
      id: "Consumer",
      timeSteps: 500,
      criticalSections: [
        {
          id: "int tmp = get();",
          startAt: 40,
          endAt: 90,
          action: {
            name: "decrements",
            stateId: "num_items",
            action: (state: number) => state - 1,
          },
        },
        {
          id: "int tmp = get();",
          startAt: 210,
          endAt: 260,
          action: {
            name: "decrements",
            stateId: "num_items",
            action: (state: number) => state - 1,
          },
        },
        {
          id: "int tmp = get();",
          startAt: 340,
          endAt: 390,
          action: {
            name: "decrements",
            stateId: "num_items",
            action: (state: number) => state - 1,
          },
        },
      ],
      semaphores: [
        {
          id: "full",
          posts: [],
          waits: [25, 195, 325],
        },
        {
          id: "empty",
          posts: [105, 275, 405],
          waits: [],
        },
        {
          id: "mutex",
          posts: [90, 260, 390],
          waits: [40, 210, 340],
        },
      ],
    },
  ],
  semaphores: [
    {
      id: "empty",
      initial: 10,
    },
    {
      id: "full",
      initial: 0,
    },
    {
      id: "mutex",
      initial: 1,
    },
  ],
  state: [
    {
      id: "num_items",
      initial: 0,
    },
  ],
};

// export const MULTI_PRODUCER_CONSUMER: ThreadsProps = {
//   title: "Multiple Consumers & Single Producer",
//   description: "The following threads example uses Semaphores to manage access to an unbounded Buffer/Queue.",
//   threads: [
//     {
//       id: "Writer",
//       timeSteps: 500,
//       criticalSections: [
//         {
//           id: "Write",
//           startAt: 50,
//           endAt: 75,
//         },
//         {
//           id: "Write",
//           startAt: 150,
//           endAt: 175,
//         },
//         {
//           id: "Write",
//           startAt: 250,
//           endAt: 275,
//         },
//         {
//           id: "Write",
//           startAt: 350,
//           endAt: 375,
//         },
//       ],
//       semaphores: [
//         {
//           id: "Semaphore",
//           posts: [90, 190, 290, 390],
//           waits: [],
//         },
//       ],
//       locks: [
//         {
//           id: "Mutex",
//           acquireAt: 50,
//           releaseAt: 75,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 150,
//           releaseAt: 175,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 250,
//           releaseAt: 275,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 350,
//           releaseAt: 375,
//         },
//       ],
//     },
//     {
//       id: "Reader 1",
//       timeSteps: 500,
//       criticalSections: [
//         {
//           id: "Read",
//           startAt: 30,
//           endAt: 60,
//         },
//         {
//           id: "Read",
//           startAt: 210,
//           endAt: 240,
//         },
//         {
//           id: "Read",
//           startAt: 360,
//           endAt: 390,
//         },
//       ],
//       semaphores: [
//         {
//           id: "Semaphore",
//           posts: [],
//           waits: [15, 195, 345],
//         },
//       ],
//       locks: [
//         {
//           id: "Mutex",
//           acquireAt: 30,
//           releaseAt: 60,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 210,
//           releaseAt: 240,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 360,
//           releaseAt: 390,
//         },
//       ],
//     },
//     {
//       id: "Reader 2",
//       timeSteps: 500,
//       criticalSections: [
//         {
//           id: "Read",
//           startAt: 130,
//           endAt: 160,
//         },
//         {
//           id: "Read",
//           startAt: 310,
//           endAt: 340,
//         },
//       ],
//       semaphores: [
//         {
//           id: "Semaphore",
//           posts: [],
//           waits: [115, 295],
//         },
//       ],
//       locks: [
//         {
//           id: "Mutex",
//           acquireAt: 130,
//           releaseAt: 160,
//         },
//         {
//           id: "Mutex",
//           acquireAt: 310,
//           releaseAt: 340,
//         },
//       ],
//     },
//   ],
//   semaphores: [
//     {
//       id: "Semaphore",
//       initial: 0,
//     },
//   ],
//   locks: [
//     {
//       id: "Mutex",
//     },
//   ],
// };

export const CV_PRODUCER_CONSUMER: ThreadsProps = {
  title: "Producer & Consumer – Condition Variables",
  description:
    "The following threads example uses Condition Variables to manage access to a bounded Buffer/Queue.",
  threads: [
    {
      id: "Producer",
      timeSteps: 500,
      criticalSections: [
        {
          id: "put(i);",
          startAt: 50,
          endAt: 100,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
        {
          id: "put(i);",
          startAt: 200,
          endAt: 250,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
        {
          id: "put(i);",
          startAt: 350,
          endAt: 400,
          action: {
            name: "increments",
            stateId: "num_items",
            action: (state: number) => state + 1,
          },
        },
      ],
      conditionVariables: [
        {
          id: "fill",
          releases: "mutex",
          conditionStr: "",
          signals: [100, 250, 400],
          waits: [],
        },
        {
          id: "empty",
          signals: [],
          releases: "mutex",
          conditionStr: "num_items == MAX",
          waits: [50, 200, 350],
        },
      ],
      locks: [
        {
          id: "mutex",
          acquireAt: 35,
          releaseAt: 115,
        },
        {
          id: "mutex",
          acquireAt: 185,
          releaseAt: 265,
        },
        {
          id: "mutex",
          acquireAt: 335,
          releaseAt: 415,
        },
      ],
    },
    {
      id: "Consumer",
      timeSteps: 500,
      criticalSections: [
        {
          id: "int tmp = get();",
          startAt: 40,
          endAt: 90,
          action: {
            name: "decrements",
            stateId: "num_items",
            action: (state: number) => state - 1,
          },
        },
        {
          id: "int tmp = get();",
          startAt: 210,
          endAt: 260,
          action: {
            stateId: "num_items",
            name: "decrements",
            action: (state: number) => state - 1,
          },
        },
        {
          id: "int tmp = get();",
          startAt: 340,
          endAt: 390,
          action: {
            stateId: "num_items",
            name: "decrements",
            action: (state: number) => state - 1,
          },
        },
      ],
      conditionVariables: [
        {
          id: "fill",
          signals: [],
          waits: [40, 210, 340],
          releases: "mutex",
          conditionStr: "num_items == 0",
        },
        {
          id: "empty",
          signals: [90, 260, 390],
          waits: [],
          releases: "mutex",
          conditionStr: "",
        },
      ],
      locks: [
        {
          id: "mutex",
          acquireAt: 25,
          releaseAt: 115,
        },
        {
          id: "mutex",
          acquireAt: 195,
          releaseAt: 275,
        },
        {
          id: "mutex",
          acquireAt: 325,
          releaseAt: 405,
        },
      ],
    },
  ],
  conditionVariables: [
    {
      id: "fill",
      stateId: "num_items",
      condition: (state: number) => state === 0,
    },
    {
      id: "empty",
      stateId: "num_items",
      condition: (state: number) => state === 5,
    },
  ],
  locks: [
    {
      id: "mutex",
    },
  ],
  state: [
    {
      id: "num_items",
      initial: 0,
    },
  ],
};

export const ZEMAPHORES: ThreadsProps = {
  title: "Zemaphore Mechanics",
  description:
    "The following example demonstrates an implementation of a Semaphore using a Lock and a Condition Variable (Zemaphores, OSTEP 31.17)",
  threads: [
    {
      id: "Thread",
      timeSteps: 300,
      criticalSections: [
        {
          id: "Zem_post(&s);",
          startAt: 50,
          endAt: 100,
          action: {
            name: "increment",
            stateId: "value",
            action: (state) => state + 1,
          },
        },
        {
          id: "Zem_wait(&s);",
          startAt: 200,
          endAt: 250,
          action: {
            name: "decrement",
            stateId: "value",
            action: (state) => state - 1,
          },
        },
      ],
      conditionVariables: [
        {
          id: "cond",
          signals: [101],
          waits: [200],
          conditionStr: "value <= 0",
          releases: "lock",
        },
      ],
      locks: [
        {
          id: "lock",
          acquireAt: 35,
          releaseAt: 115,
        },
        {
          id: "lock",
          acquireAt: 185,
          releaseAt: 265,
        },
      ],
    },
  ],
  conditionVariables: [
    {
      id: "cond",
      stateId: "value",
      condition: (state) => state <= 0,
    },
  ],
  locks: [
    {
      id: "lock",
    },
  ],
  state: [
    {
      id: "value",
      initial: 0,
    },
  ],
};
