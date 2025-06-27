export interface CriticalSection {
  id: string;
  startAt: number;
  endAt: number;
}

export interface LockContext {
  id: string;
  acquireAt: number;
  releaseAt: number;
}

export interface LockState {
  heldBy?: string;
  waiting: string[];
}

export interface SemaphoreState {
  count: number;
  waiting: Array<string>;
}

export interface SemaphoreContext {
  id: string;
  posts: number[];
  waits: number[];
}

export interface Thread {
  id: string;
  timeSteps: number;
  criticalSections: CriticalSection[];
  locks: LockContext[];
  semaphores: SemaphoreContext[];
}

export interface ThreadState {
  timeStep: number;
}

export interface Lock {
  id: string;
}

export interface Semaphore {
  id: string;
  initial: number;
}

export interface MutualExclusionViolation {
  criticalSectionId: string;
  threadIds: string[];
}

export enum ThreadAction {
  LOCK_ACQUIRE = "LOCK_ACQUIRE",
  LOCK_RELEASE = "LOCK_RELEASE",
  LOCK_WAIT = "LOCK_WAIT",
  CRITICAL_SECTION_ENTER = "CRITICAL_SECTION_ENTER",
  CRITICAL_SECTION_EXIT = "CRITICAL_SECTION_EXIT",
  SEM_WAIT = "SEM_WAIT",
  SEM_PASS = "SEM_PASS",
  SEM_POST = "SEM_POST",
}

export interface ThreadEvent {
  threadId: string;
  action: ThreadAction;
  timeStep: number;
  resourceId: string;
}

export const LOCK_COLORS = ["green", "purple", "orange"];

export const SEM_COLORS = ["green", "purple", "orange"]

export const CRITICAL_SECTION_COLORS = ["blue", "red", "yellow"];

export interface ThreadsController {
  runThread: (thread?: Thread) => void;
  reset: () => void;
  setPlaybackSpeed: (pbs: number) => void;
  playbackSpeed: number;
  mutualExclusionViolations: MutualExclusionViolation[];
  threads: Thread[];
  events: ThreadEvent[];
  locks: Lock[];
  semaphores: Semaphore[];
  running?: Thread;
  threadState: Record<string, ThreadState>;
  colors: Record<string, string>;
  step: (thread: Thread) => void;
  lockState: Record<string, LockState>;
  semaphoreState: Record<string, SemaphoreState>;
}
