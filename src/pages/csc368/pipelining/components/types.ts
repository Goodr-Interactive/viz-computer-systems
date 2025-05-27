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
  registers: {
    src: string[];
    dest: string[];
  };
}

