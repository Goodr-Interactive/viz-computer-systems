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
    waiting: Array<string>; 
}

export interface SemaphoreState {
    heldBy: Array<string>;
    waiting: Array<string>;
}

export interface SemaphoreContext {
    id: string;
}

export interface Thread {
    id: string;
    timeSteps: number;
    criticalSections: Array<CriticalSection>;
    locks: Array<LockContext>;
    semaphores: Array<SemaphoreContext>;
}

export interface ThreadState {
    timeStep: number;
}

export interface Lock {
    id: string;
};

export interface Semaphore {
    id: string;
    initial: number;
};

export interface MutualExclusionViolation {
    criticalSectionId: string;
    threadIds: Array<string>;
}

export enum ThreadAction {
    LOCK_ACQUIRE = "LOCK_ACQUIRE",
    RELEASE_LOCK = "LOCK_RELEASE",
    SEM_WAIT = "SEM_WAIT",
    SEM_POST = "SEM_POST"
}

export interface ThreadEvent {
    threadId: string;
    action: ThreadAction;
    timeStep: number;
}


export interface ThreadsController {
    runThread: (thread?: Thread) => void;
    reset: () => void;
    setPlaybackSpeed: (pbs: number) => void;
    playbackSpeed: number;
    mutualExclusionViolations: Array<MutualExclusionViolation>;
    threads: Array<Thread>;
    events: Array<ThreadEvent>;
    locks: Array<Lock>;
    semaphores: Array<Semaphore>;
    running?: Thread;
}
