export interface Instruction {
  id: number;
  name: string;
  color: string;
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
  registers: {
    src: string[];
    dest: string[];
  };
}

