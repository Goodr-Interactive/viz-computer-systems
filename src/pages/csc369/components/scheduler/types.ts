export enum EventType {
    SUSPENDED = "SUSPENDED",
    EXECUTED = "EXECUTED",
}

export interface ProcessEvent {
    type: EventType;
    timestamp: number;
}

export enum ProcessStatus {
    RUNNING = "RUNNING",
    WAITING = "WAITING",
    COMPLETE = "COMPLETE"
}

export interface Process {
    pid: number;
    duration: number;
    events: Array<ProcessEvent>;
    status: ProcessStatus;
    enquedAt: number;
    completedAt: number;
}

export enum Algorithm {
    FCFS = "FCFS",
    SJF = "SJF",
    SCTF = "STCF",
    CFS = "CFS",
    RR = "RR"
}

export enum SchedulerState {
    RUNNING = "RUNNING",
    PAUSED = "PAUSED"
}


export interface SchedulerController {
    state: SchedulerState
    processes: Array<Process>;
    addProcess: (process: Process) => void;
    contextSwitchFrequency: number;
    contextSwitchDuration: number;
    setContextSwitchFrequency: (csf: number) => void;
    setContextSwitchDuration: (csd: number) => void;
    pause: () => void;
    play: () => void;
    reset: () => void;
    algorithm: Algorithm;
    setAlgorithm: (algo: Algorithm) => void;
    quizMode: boolean;
    setQuizMode: (qm: boolean) => void;
}
