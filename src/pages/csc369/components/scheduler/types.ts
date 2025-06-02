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
  COMPLETE = "COMPLETE",
}

export interface Process {
  pid: number;
  duration: number;
  events: ProcessEvent[];
  status: ProcessStatus;
  enquedAt: number;
  completedAt?: number;
  vruntime: number;
  unknownRuntime?: boolean;
}

export enum Algorithm {
  FCFS = "FCFS",
  SJF = "SJF",
  SCTF = "STCF",
  CFS = "CFS",
  RR = "RR",
  DIY = "DIY"
}

export enum SchedulerState {
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
}

export interface QuizQuestion {
  options: Array<number>;
  correct: number;
}

export interface QuizController {
  answer: (pid: number) => void;
  results: Array<[QuizQuestion, number]>;
  question?: QuizQuestion;
  setQuestion: (q?: QuizQuestion) => void;
  reset: () => void;
  skip: () => void;
}

export interface SchedulerController {
  state: SchedulerState;
  clock: number;
  processes: Process[];
  addProcess: (process: Process) => void;
  contextSwitchFrequency: number;
  contextSwitchDuration: number;
  setContextSwitchFrequency: (csf: number) => void;
  setContextSwitchDuration: (csd: number) => void;
  pause: () => void;
  play: () => void;
  reset: () => void;
  skipForward: () => void;
  skipBack: () => void;
  algorithm: Algorithm;
  setAlgorithm: (algo: Algorithm) => void;
  quizMode: boolean;
  setQuizMode: (qm: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (pbs: number) => void;
  quiz: QuizController;
  contextSwitchTimes: [number, number];
}


