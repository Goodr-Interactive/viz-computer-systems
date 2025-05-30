export interface StageHistoryEntry {
  stageIndex: number;
  entryCycle: number;
  duration: number; // Duration of this specific stage instance
  abbreviation: string; // Base abbreviation for this stage
  color: string; // Color for this stage
}

export interface Instruction {
  id: number;
  name: string;
  color: string;
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
  stageProgress?: number; // Tracks how many cycles completed in current stage
  stageDuration?: number; // Tracks the total cycles required for the current stage
  stallReason?: string; // Explains why the instruction is stalled
  isCompleted?: boolean; // Flag to indicate if instruction has completed all stages
  registers: {
    src: string[];
    dest: string[];
  };
  stageHistory?: StageHistoryEntry[]; // Added to track all stages entered
}

