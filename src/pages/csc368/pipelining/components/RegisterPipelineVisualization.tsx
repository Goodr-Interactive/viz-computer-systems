import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Import React components
import { PipelineStage } from "./PipelineStage";
import { Axis } from "./Axis";
import { Grid } from "./Grid";
import type { Instruction } from "./types";



// Define the pipeline stage configuration type
interface PipelineStageConfig {
  name: string;
  abbreviation: string;
  color: string;
  defaultDuration: number;
  duration: number;
  description: string;
}

// Define the instruction stages with register visualization
const PIPELINE_STAGES: PipelineStageConfig[] = [
  { 
    name: "Fetch", 
    abbreviation: "F", 
    color: "#4285F4", 
    defaultDuration: 1, 
    duration: 1,
    description: "Fetches instruction from memory"
  },
  { 
    name: "Decode", 
    abbreviation: "D", 
    color: "#EA4335", 
    defaultDuration: 1, 
    duration: 1,
    description: "Decodes instruction and reads registers"
  },
  { 
    name: "Execute", 
    abbreviation: "E", 
    color: "#FBBC05", 
    defaultDuration: 1, 
    duration: 1,
    description: "Performs ALU operations"
  },
  { 
    name: "Memory", 
    abbreviation: "M", 
    color: "#34A853", 
    defaultDuration: 1, 
    duration: 1,
    description: "Accesses data memory"
  },
  { 
    name: "Writeback", 
    abbreviation: "W", 
    color: "#8F44AD", 
    defaultDuration: 1, 
    duration: 1,
    description: "Writes results back to registers"
  },
];

// Define some sample instructions for visualization
const DEFAULT_INSTRUCTIONS = [
  { id: 1, name: "lw x1, 0(x20)", color: "#4285F4", registers: { src: ["x20"], dest: ["x1"] } },
  { id: 2, name: "lw x2, 4(x20)", color: "#EA4335", registers: { src: ["x20"], dest: ["x2"] } },
  {
    id: 3,
    name: "add x3, x1, x2",
    color: "#FBBC05",
    registers: { src: ["x1", "x2"], dest: ["x3"] },
  },
  { id: 4, name: "sw x3, 8(x20)", color: "#34A853", registers: { src: ["x3", "x20"], dest: [] } },
  { id: 5, name: "blt x0, x3, loop", color: "#8F44AD", registers: { src: ["x0", "x3"], dest: [] } },
];


interface RegisterPipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
  pipelineStages?: PipelineStageConfig[];
}

export const RegisterPipelineVisualization: React.FC<RegisterPipelineVisualizationProps> = ({
  width,
  height,
  instructions = DEFAULT_INSTRUCTIONS,
  pipelineStages = PIPELINE_STAGES,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(width || 800);
  const [svgHeight, setSvgHeight] = useState<number>(height || 400);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true); // Toggle between pipelined and non-pipelined
  const [stageConfigs, setStageConfigs] = useState<PipelineStageConfig[]>(pipelineStages);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showSystemInfo, setShowSystemInfo] = useState<boolean>(true);
  const [stageConfigOpen, setStageConfigOpen] = useState<boolean>(false);
  const [timeUnit, setTimeUnit] = useState<'cycles' | 'seconds' | 'minutes' | 'hours'>('cycles');
  const [cycleTime, setCycleTime] = useState<number>(1); // Time in nanoseconds per cycle

  // Register state
  const [registers, setRegisters] = useState<Record<string, number>>({
    x0: 0, // x0 is hardwired to 0 in RISC-V
    x1: 0,
    x2: 0,
    x3: 0,
    x20: 0x1000, // Base address for memory operations
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    instructionName: string;
    stageName: string;
    timeLabel: string;
    registers?: {
      src: string[];
      dest: string[];
    };
  }>({
    visible: false,
    x: 0,
    y: 0,
    instructionName: "",
    stageName: "",
    timeLabel: "",
    registers: { src: [], dest: [] },
  });
  
  // Add instruction state
  const [newInstructionName, setNewInstructionName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [availableColors] = useState<string[]>([
    "#4285F4",
    "#EA4335",
    "#FBBC05",
    "#34A853",
    "#8F44AD",
    "#FF5722",
    "#009688",
    "#673AB7",
    "#3F51B5",
    "#00BCD4",
    "#607D8B",
    "#795548",
    "#9C27B0",
    "#2196F3",
    "#FF9800",
  ]);

  // Set initial dimensions based on container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSvgWidth(width);
      setSvgHeight(Math.max(height, 400));
    }
  }, []);

  // Add dimension monitoring
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;

      const { width, height } = entries[0].contentRect;
      setSvgWidth(width);
      setSvgHeight(Math.max(height, 400)); // Minimum height of 400px
    });

    resizeObserver.observe(containerRef.current);

    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setSvgWidth(width);
        setSvgHeight(Math.max(height, 400));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Initialize pipeline
  useEffect(() => {
    // Initialize pipelineInstructions based on defaultInstructions or an empty array
    // This effect runs when defaultInstructions or stageConfigs change, or on initial mount.
    const initialInstructions = instructions.map((instr, index) => ({
      ...instr,
      id: index,
      currentStage: -1, // Initialize to -1 (not started)
      stageProgress: 0,
      stageDuration: 0, // Will be set when entering a stage
      stalled: false,
      // Ensure startCycle is undefined initially or handled appropriately
      startCycle: undefined, 
      stageHistory: [], // Initialize stageHistory
    }));
    setPipelineInstructions(initialInstructions);
    // If you want to reset cycles too when instructions/configs change:
    // setCycles(0); 
  }, [instructions]); // Assuming stageConfigs might not be a direct dependency here for re-init, but for logic inside.

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    // Check if all instructions are completed
    const allInstructionsCompleted = pipelineInstructions.every(
      (instr) => instr.currentStage !== undefined && instr.currentStage >= stageConfigs.length
    );

    if (allInstructionsCompleted) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      // Increment cycle
      setCycles((prev) => prev + 1);

      
      // Update each instruction's position in the pipeline
      setPipelineInstructions((prevInstructions) => {
        if (isPipelined) {
          // First, identify instructions that need to stall.
          const stallMap = new Map<number, {stalled: boolean; reason?: string}>();
          
          // Track which stages are currently occupied
          const stageOccupancy = new Map<number, { 
            instructionId: number; 
            instructionName: string;
          }>();
          
          // First pass: identify all currently occupied stages
          prevInstructions.forEach((instr) => {
            if (instr.currentStage !== undefined && 
                instr.currentStage >= 0 && 
                instr.currentStage < stageConfigs.length) {
              
              // Only consider a stage occupied if the instruction will still be there next cycle
              const currentStageConfig = stageConfigs[instr.currentStage];
              const currentProgress = instr.stageProgress || 0;
              
              // If instruction will advance next cycle, stage will be free
              if (currentProgress < currentStageConfig.duration) {
                // Instruction will still be in this stage next cycle
                stageOccupancy.set(instr.currentStage, {
                  instructionId: instr.id,
                  instructionName: instr.name
                });
              }
            }
          });
          
          // Second pass: process instructions in order to ensure proper stall propagation
          for (let idx_being_checked = 0; idx_being_checked < prevInstructions.length; idx_being_checked++) {
            const instr_being_checked = prevInstructions[idx_being_checked];
            
            // Skip if instruction is already completed
            if (instr_being_checked.currentStage !== undefined && 
                instr_being_checked.currentStage >= stageConfigs.length) {
              continue;
            }
            
            // Determine the target stage for this instruction
            let target_stage: number | undefined;
            
            if (instr_being_checked.currentStage === -1) {
              // Instruction wants to enter the first stage
              target_stage = 0;
            } else if (instr_being_checked.currentStage !== undefined && 
                       instr_being_checked.currentStage >= 0 && 
                       instr_being_checked.currentStage < stageConfigs.length) {
              // Check if instruction can advance to next stage
              const currentStageConfig = stageConfigs[instr_being_checked.currentStage];
              const currentProgress = instr_being_checked.stageProgress || 0;
              
              if (currentProgress >= currentStageConfig.duration) {
                // Instruction is ready to move to next stage
                target_stage = instr_being_checked.currentStage + 1;
                
                // If target stage is beyond pipeline, instruction is completing
                if (target_stage >= stageConfigs.length) {
                  continue; // Instruction is completing, no stall needed
                }
              } else {
                // Instruction still needs more cycles in current stage
                continue; // No advancement needed, no stall check required
              }
            } else {
              continue; // Invalid state
            }

            // Check for structural hazards - is the target stage occupied?
            if (target_stage !== undefined) {
              const occupancy = stageOccupancy.get(target_stage);
              if (occupancy && occupancy.instructionId !== instr_being_checked.id) {
                // Target stage is occupied by another instruction
                stallMap.set(idx_being_checked, {
                  stalled: true,
                  reason: `Waiting for ${occupancy.instructionName} to leave stage ${stageConfigs[target_stage]?.name || 'Unknown'} (structural hazard)`
                });
                continue; // This instruction is stalled, check next instruction
              }
            }

            // Check for in-order execution constraints
            for (let prevIdx = 0; prevIdx < idx_being_checked; prevIdx++) {
              const prevInstr = prevInstructions[prevIdx];

              // Skip if previous instruction is completed
              if (prevInstr.currentStage === undefined || 
                  prevInstr.currentStage < 0 || 
                  prevInstr.currentStage >= stageConfigs.length) {
                continue;
              }

              // Check if previous instruction is already stalled (stall propagation)
              if (stallMap.get(prevIdx)?.stalled) {
                stallMap.set(idx_being_checked, {
                  stalled: true,
                  reason: `Waiting for ${prevInstr.name} (stall propagation)`
                });
                break;
              }

              // In-order constraint: prevent current instruction from advancing beyond previous instruction
              // Only apply this if current instruction would advance to a stage that is ahead of where
              // the previous instruction currently is
              if (target_stage !== undefined && 
                  prevInstr.currentStage !== undefined && 
                  target_stage > prevInstr.currentStage) {
                stallMap.set(idx_being_checked, {
                  stalled: true,
                  reason: `Cannot advance past ${prevInstr.name} (in-order execution)`
                });
                break;
              }
            }
          }
          
          let canStartNewInstructionThisCycle = true; // Allow one new instruction to start per cycle

          return prevInstructions.map((instr, idx) => {
            let updatedInstr = { ...instr }; // Start with a copy

            // 1. Handle instructions already completed
            if (updatedInstr.currentStage !== undefined && updatedInstr.currentStage >= stageConfigs.length) {
              return updatedInstr;
            }

            // 2. Handle instructions scheduled to start at a specific future cycle (if currentStage is -1)
            if (updatedInstr.currentStage === -1 && updatedInstr.startCycle !== undefined && updatedInstr.startCycle > cycles) {
              return updatedInstr; // Not its time to start yet
            }
            
            // 3. Check if this instruction is stalled by the stallMap
            if (stallMap.get(idx)?.stalled) {
              return {
                ...updatedInstr,
                stalled: true,
                stallReason: stallMap.get(idx)?.reason,
              };
            }

            // 4. If not stalled by stallMap, try to start (if at -1) or advance
            if (updatedInstr.currentStage === -1) { // Instruction is waiting to enter the pipeline
              if (canStartNewInstructionThisCycle) {
                canStartNewInstructionThisCycle = false; // Consume the slot for this cycle
                const firstStageConfig = stageConfigs[0];
                if (firstStageConfig) {
                  updatedInstr = {
                    ...updatedInstr,
                    currentStage: 0,
                    stageProgress: 1,
                    stageDuration: firstStageConfig.duration || 1,
                    stalled: false,
                    startCycle: cycles, 
                    stageHistory: [
                      {
                        stageIndex: 0,
                        entryCycle: cycles,
                        duration: firstStageConfig.duration || 1,
                        abbreviation: firstStageConfig.abbreviation,
                        color: firstStageConfig.color,
                      },
                      ...(updatedInstr.stageHistory || [])
                    ],
                  };
                }
              } else {
                // Another instruction started this cycle, or it couldn't start due to other reasons (e.g. stallMap)
                // It remains at currentStage: -1. Ensure stalled is false if not stalled by stallMap.
                updatedInstr.stalled = false; // Not stalled by pipeline entry rate limit itself
              }
            } else if (typeof updatedInstr.currentStage === 'number' && updatedInstr.currentStage < stageConfigs.length) {
              // Instruction is in the pipeline and not stalled by stallMap, advance it
              const currentStageConfig = stageConfigs[updatedInstr.currentStage];
              if (!currentStageConfig) {
                console.warn(`Undefined stage config for index: ${updatedInstr.currentStage}.`);
                return updatedInstr; 
              }

              const requiredCycles = currentStageConfig.duration;
              if ((updatedInstr.stageProgress || 0) >= requiredCycles) {
                // Advance to the next stage
                const nextStage = updatedInstr.currentStage + 1;
                const nextStageConfig = nextStage < stageConfigs.length ? stageConfigs[nextStage] : null;
                
                let newHistory = updatedInstr.stageHistory || [];
                if (nextStageConfig) {
                  newHistory = [
                    ...newHistory,
                    {
                      stageIndex: nextStage,
                      entryCycle: cycles, // Current cycle is the entry for the new stage
                      duration: nextStageConfig.duration || 1,
                      abbreviation: nextStageConfig.abbreviation,
                      color: nextStageConfig.color,
                    }
                  ];
                }

                updatedInstr = {
                  ...updatedInstr,
                  currentStage: nextStage,
                  stageProgress: 1,
                  stageDuration: nextStageConfig?.duration || 1,
                  stalled: false,
                  stageHistory: newHistory,
                };
              } else {
                updatedInstr = {
                  ...updatedInstr,
                  stageProgress: (updatedInstr.stageProgress || 0) + 1,
                  stalled: false,
                };
              }
            }
            return updatedInstr;
          });
        } else {
          // Non-pipelined execution - only one instruction can be active at a time
          const activeInstructionIndex = prevInstructions.findIndex(
            (instr) =>
              instr.currentStage !== undefined &&
              instr.currentStage >= 0 &&
              instr.currentStage < stageConfigs.length
          );

          if (activeInstructionIndex === -1) {
            // No active instruction, try to start the next one
            const nextInstructionIndex = prevInstructions.findIndex(
              (instr) => instr.currentStage === -1
            );

            if (nextInstructionIndex !== -1) {
              return prevInstructions.map((instr, index) => {
                if (index === nextInstructionIndex) {
                  return { 
                    ...instr, 
                    currentStage: 0, 
                    startCycle: cycles,
                    stageProgress: 1, // First cycle in this stage
                    stageDuration: index === 0 && stageConfigs.length > 0 && stageConfigs[0] ? stageConfigs[0].duration : 0,
                  };
                }
                return instr;
              });
            }
            return prevInstructions; // All done
          }

          // Advance the active instruction
          let updatedInstructions = [...prevInstructions];

          if (
            updatedInstructions[activeInstructionIndex].currentStage !== undefined &&
            updatedInstructions[activeInstructionIndex].currentStage < stageConfigs.length -1 // Check if not in the last stage already
          ) {
            const currentStageIdx = updatedInstructions[activeInstructionIndex].currentStage!;
            const currentStageConfig = stageConfigs[currentStageIdx];
            const requiredCycles = currentStageConfig.duration;
            const currentProgress = updatedInstructions[activeInstructionIndex].stageProgress || 0;
            
            if (currentProgress >= requiredCycles) {
              // Move to the next stage
              const nextStage = currentStageIdx + 1;
              const nextStageConfig = nextStage < stageConfigs.length ? stageConfigs[nextStage] : null;
              
              let newHistory = updatedInstructions[activeInstructionIndex].stageHistory || [];
              if (nextStageConfig) {
                newHistory = [
                  ...newHistory,
                  {
                    stageIndex: nextStage,
                    entryCycle: cycles, // Current cycle is entry for new stage
                    duration: nextStageConfig.duration || 1,
                    abbreviation: nextStageConfig.abbreviation,
                    color: nextStageConfig.color,
                  }
                ];
              }
              
              updatedInstructions[activeInstructionIndex] = {
                ...updatedInstructions[activeInstructionIndex],
                currentStage: nextStage,
                stageProgress: 1, // First cycle in new stage
                stageDuration: nextStageConfig?.duration || 1, 
                stageHistory: newHistory,
              };
            } else {
              // Increment progress in current stage
              updatedInstructions[activeInstructionIndex] = {
                ...updatedInstructions[activeInstructionIndex],
                stageProgress: currentProgress + 1,
              };
            }
          } else {
            // Check if we've completed the final stage
            const currentStage = updatedInstructions[activeInstructionIndex].currentStage!;
            const currentStageConfig = stageConfigs[currentStage];
            const requiredCycles = currentStageConfig.duration;
            const currentProgress = updatedInstructions[activeInstructionIndex].stageProgress || 0;
            
            if (currentProgress >= requiredCycles) {
              // This instruction is done, mark it as completed
              updatedInstructions[activeInstructionIndex] = {
                ...updatedInstructions[activeInstructionIndex],
                currentStage: stageConfigs.length,
              };

              // Immediately start the next instruction if available
              const nextInstructionIndex = updatedInstructions.findIndex(
                (instr) => instr.currentStage === -1
              );

              if (nextInstructionIndex !== -1) {
                updatedInstructions[nextInstructionIndex] = {
                  ...updatedInstructions[nextInstructionIndex],
                  currentStage: 0,
                  startCycle: cycles,
                  stageProgress: 1, // First cycle in this stage
                  stageDuration: stageConfigs[0]?.duration || 1,
                };
              }
            } else {
              // Increment progress in the final stage
              updatedInstructions[activeInstructionIndex] = {
                ...updatedInstructions[activeInstructionIndex],
                stageProgress: currentProgress + 1,
              };
            }
          }

          return updatedInstructions;
        }
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, cycles, speed, isPipelined, pipelineInstructions, stageConfigs]); // <<< FIX: Add pipelineInstructions and stageConfigs

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setCycles(0);
    // setActiveInstructionIndex(0); // Commented out due to "Cannot find name" error. Review non-pipelined active instruction logic.
    // TODO: Determine how activeInstructionIndex or its equivalent should be reset for non-pipelined mode.
    // If using activeInstructionId, perhaps:
    // setActiveInstructionId(defaultInstructions.length > 0 ? defaultInstructions[0].id : null);


    let updatedInstructions;

    if (isPipelined) {
      updatedInstructions = DEFAULT_INSTRUCTIONS.map((instr, index) => ({
        ...instr,
        id: instr.id !== undefined ? instr.id : index, // Prefer existing id if available
        currentStage: -1,
        stageProgress: 0,
        stageDuration: 0,
        stalled: false,
        startCycle: undefined,
        stageHistory: [], // Initialize stageHistory
      }));
    } else {
      // Non-pipelined mode initialization
      updatedInstructions = DEFAULT_INSTRUCTIONS.map((instr, index) => {
        const initialStageConfig = stageConfigs.length > 0 && stageConfigs[0] ? stageConfigs[0] : null;
        const historyEntry = initialStageConfig && index === 0 ? [{
          stageIndex: 0,
          entryCycle: 0,
          duration: initialStageConfig.duration,
          abbreviation: initialStageConfig.abbreviation,
          color: initialStageConfig.color,
        }] : [];

        return {
          ...instr,
          id: instr.id !== undefined ? instr.id : index,
          currentStage: index === 0 ? 0 : -1, 
          stageProgress: index === 0 ? 1 : 0, // Start progress for the first instruction
          stageDuration: index === 0 && initialStageConfig ? initialStageConfig.duration : 0,
          stalled: false,
          startCycle: index === 0 ? 0 : undefined,
          stageHistory: historyEntry, // Initialize stageHistory for non-pipelined
        };
      });
    }
    setPipelineInstructions(updatedInstructions);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(2000 - parseInt(e.target.value, 10));
  };

  const togglePipelineMode = () => {
    setIsRunning(false);
    setIsPipelined(!isPipelined);
    handleReset();
  };

  // Add instruction handlers
  const handleAddInstruction = () => {
    const newInstructionNameTrimmed = newInstructionName.trim();
    if (!newInstructionNameTrimmed) return;

    const newInstruction: Instruction = {
      id: pipelineInstructions.length > 0 ? Math.max(...pipelineInstructions.map(i => i.id)) + 1 : 1, // Ensure unique ID
      name: newInstructionNameTrimmed,
      color: availableColors[pipelineInstructions.length % availableColors.length],
      currentStage: -1, 
      stageProgress: 0,
      stageDuration: 0, 
      stalled: false,
      registers: { src: [], dest: [] }, 
      stageHistory: [], // Initialize stageHistory
      // startCycle will be set when the instruction actually starts
    };
    setPipelineInstructions(prevInstructions => [...prevInstructions, newInstruction]);
    setNewInstructionName(""); // Clear input field
  };

  const handleRemoveInstruction = (id: number) => {
    setIsRunning(false);
    const updatedInstructions = pipelineInstructions.filter((instr) => instr.id !== id);

    // Reassign IDs to keep them sequential
    const reindexedInstructions = updatedInstructions.map((instr, index) => {
      const newId = index + 1;
      let startCycle;

      if (isPipelined) {
        startCycle = index;
      } else {
        startCycle = undefined;
      }

      return {
        ...instr,
        id: newId,
        startCycle: startCycle,
      };
    });

    setPipelineInstructions(reindexedInstructions);
    setCycles(0);
  };

  // Convert clock cycles to clock labels
  const getTimeLabels = () => {
    return d3.range(0, cycles + 5).map((cycle) => `Cycle ${cycle}`);
  };

  // Calculate CPI (Cycles Per Instruction) and IPC (Instructions Per Cycle)
  const cpi =
    pipelineInstructions.length > 0 && cycles > 0
      ? (cycles / Math.min(cycles, pipelineInstructions.length)).toFixed(2)
      : "0.00";

  const ipc =
    cycles > 0 ? (Math.min(cycles, pipelineInstructions.length) / cycles).toFixed(2) : "0.00";

  // Calculate theoretical maximum metrics
  const theoreticalMaxCPI = isPipelined ? "1.00" : stageConfigs.length.toFixed(2);
  const theoreticalMaxIPC = isPipelined ? "1.00" : (1 / stageConfigs.length).toFixed(2);
  

  
  // Convert time to selected unit
  const convertTime = (cycles: number): string => {
    const cycleTimeNs = cycleTime; // Time in nanoseconds per cycle
    switch (timeUnit) {
      case 'seconds':
        return ((cycles * cycleTimeNs) / 1000000000).toFixed(9) + ' s';
      case 'minutes':
        return ((cycles * cycleTimeNs) / 60000000000).toFixed(9) + ' min';
      case 'hours':
        return ((cycles * cycleTimeNs) / 3600000000000).toFixed(12) + ' hr';
      case 'cycles':
      default:
        return cycles.toString() + ' cycles';
    }
  };

  // Stage Legend Component
  const PipelineStageLegend = () => {
    if (!showLegend) return null;
    
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Pipeline Stages</h3>
          <button 
            onClick={() => setShowLegend(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {stageConfigs.map((stage, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 rounded bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: stage.color }}>
                <span className="text-white font-bold">{stage.abbreviation}</span>
              </div>
              <div className="flex-grow">
                <div className="font-medium">{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.description}</div>
                <div className={`text-sm mt-1 ${stage.duration > 1 ? 'font-semibold text-indigo-600' : ''}`}>
                  Duration: {stage.duration} cycle{stage.duration > 1 ? 's' : ''}
                </div>
              </div>
              {stage.duration > 1 && (
                <div className="bg-yellow-100 px-2 py-1 rounded text-xs text-yellow-800 whitespace-nowrap">
                  Multi-cycle
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-500 border-t pt-2">
          <p className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-200 mr-2 border border-red-500"></span>
            Stalled stages appear in red with a pattern
          </p>
          <p className="flex items-center mt-1">
            <span className="mr-2 font-mono text-xs">F(2/5)</span>
            Format shows current progress / total cycles for the stage
          </p>
        </div>
      </div>
    );
  };

  // System Information Panel
  const SystemInformationPanel = () => {
    if (!showSystemInfo) return null;
    
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">System Information</h3>
          <button 
            onClick={() => setShowSystemInfo(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">Time Unit:</span>
            <div className="flex gap-2">
              {(['cycles', 'seconds', 'minutes', 'hours'] as const).map(unit => (
                <button
                  key={unit}
                  onClick={() => setTimeUnit(unit)}
                  className={`px-2 py-1 text-xs rounded ${timeUnit === unit ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                >
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-1">
            <span className="font-medium">Cycle Time: </span>
            <input 
              type="number" 
              value={cycleTime}
              onChange={(e) => setCycleTime(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            /> ns
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-gray-50 p-2">
            <div className="text-sm text-gray-500">Total Time</div>
            <div className="font-mono font-medium">{convertTime(cycles)}</div>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <div className="text-sm text-gray-500">Sequential Time (Actual Durations)</div>
            <div className="font-mono font-medium">{convertTime((() => {
              // Count instructions that have been started (currentStage >= 0) or completed
              const startedOrCompletedInstructions = pipelineInstructions.filter(instr => 
                instr.currentStage !== undefined && instr.currentStage >= 0
              ).length;
              
              // If no instructions have started, show 0
              if (startedOrCompletedInstructions === 0) return 0;
              
              // Calculate sequential time for started/completed instructions
              const totalDurationPerInstruction = stageConfigs.reduce((sum, stage) => sum + stage.duration, 0);
              return startedOrCompletedInstructions * totalDurationPerInstruction;
            })())}</div>
            </div>
          <div className="rounded bg-gray-50 p-2">
            <div className="text-sm text-gray-500">Ideal Time (Pipelined)</div>
            <div className="font-mono font-medium">{convertTime(pipelineInstructions.length + stageConfigs.length - 1)}</div>
          </div>
          <div className="rounded bg-gray-50 p-2">
            <div className="text-sm text-gray-500">Ideal Time (Sequential)</div>
            <div className="font-mono font-medium">{convertTime(pipelineInstructions.length * stageConfigs.length)}</div>
          </div>

          <div className="rounded bg-gray-50 p-2">
            <div className="text-sm text-gray-500">Speedup vs Sequential</div>
            <div className="font-mono font-medium">
              {cycles > 0 
                ? (() => {
                    // Count instructions that have been started (currentStage >= 0) or completed
                    const startedOrCompletedInstructions = pipelineInstructions.filter(instr => 
                      instr.currentStage !== undefined && instr.currentStage >= 0
                    ).length;
                    
                    if (startedOrCompletedInstructions === 0) return 'N/A';
                    
                    const sequentialTime = startedOrCompletedInstructions * stageConfigs.reduce((sum, stage) => sum + stage.duration, 0);
                    return (sequentialTime / cycles).toFixed(2) + 'x';
                  })()
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stage Configuration UI
  const PipelineStageConfig = () => {
    if (!stageConfigOpen) return null;
    
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Stage Configuration</h3>
          <button 
            onClick={() => setStageConfigOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          {stageConfigs.map((stage, index) => (
            <div key={index} className="flex items-center gap-2 rounded bg-gray-50 p-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: stage.color }}>
                <span className="text-white font-bold">{stage.abbreviation}</span>
              </div>
              <div className="flex-grow">
                <div className="font-medium">{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.description}</div>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium">Duration:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={stage.duration}
                  onChange={(e) => {
                    const newValue = Math.max(1, parseInt(e.target.value) || 1);
                    const updatedConfigs = [...stageConfigs];
                    updatedConfigs[index] = { ...stage, duration: newValue };
                    setStageConfigs(updatedConfigs);
                  }}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <button 
            onClick={() => {
              // Reset all durations to default
              const defaultConfigs = stageConfigs.map(stage => ({ ...stage, duration: stage.defaultDuration }));
              setStageConfigs(defaultConfigs);
              
              // Also update instructions if they're currently running
              if (cycles > 0) {
                setPipelineInstructions(prevInstructions => 
                  prevInstructions.map(instr => {
                    if (instr.currentStage !== undefined && instr.currentStage >= 0 && instr.currentStage < stageConfigs.length) {
                      return {
                        ...instr,
                        stageDuration: defaultConfigs[instr.currentStage].duration
                      };
                    }
                    return instr;
                  })
                );
              }
            }}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
          >
            Reset to Default
          </button>
          <button 
            onClick={() => setStageConfigOpen(false)}
            className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }
  // Set up D3 scales for our chart
  const margin = { top: 50, right: 30, bottom: 50, left: 100 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  // X scale for cycles
  const xScale = d3
    .scaleBand()
    .domain(d3.range(0, cycles + 5).map(String))
    .range([0, innerWidth])
    .padding(0.02);

  // Y scale for instructions
  const yScale = d3
    .scaleBand()
    .domain(pipelineInstructions.map((instr) => instr.id.toString()))
    .range([0, innerHeight])
    .padding(0.1);

  const timeLabels = getTimeLabels();

  // Handle tooltip display
  const handleStageMouseEnter = (
    event: React.MouseEvent,
    instruction: Instruction,
    stageName: string,
    timeLabel: string
  ) => {
    setTooltip({
      visible: true,
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
      instructionName: instruction.name,
      stageName,
      timeLabel,
      registers: instruction.registers,
    });
  };

  const handleStageMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  // Custom tooltip component for register pipeline
  const RegisterPipelineTooltip = () => {
    if (!tooltip.visible) return null;

    // Find stage config and progress information
    const stageIndex = stageConfigs.findIndex(s => s.name === tooltip.stageName);
    const instruction = pipelineInstructions.find(i => i.name === tooltip.instructionName);
    const stageConfig = stageIndex >= 0 ? stageConfigs[stageIndex] : null;
    const stageProgress = instruction?.stageProgress || 0;

    return (
      <g className="tooltip" transform={`translate(${tooltip.x + 10}, ${tooltip.y - 10})`}>
        <rect
          fill="white"
          stroke="black"
          rx={5}
          ry={5}
          width={220}
          height={instruction?.stalled ? 130 : 110}
          opacity={0.9}
        />
        <text x={10} y={20}>
          {`Instruction: ${tooltip.instructionName}`}
        </text>
        <text x={10} y={40}>
          {`Stage: ${tooltip.stageName} (${tooltip.timeLabel})`}
        </text>
        {stageConfig && (
          <text x={10} y={60} fill={instruction?.stalled ? "red" : "black"}>
            {`Progress: ${stageProgress}/${stageConfig.duration} cycles${instruction?.stalled ? " (STALLED)" : ""}`}
          </text>
        )}
        <text x={10} y={80}>
          {`Source: ${tooltip.registers?.src.join(", ") || "none"}`}
        </text>
        <text x={10} y={100}>
          {`Destination: ${tooltip.registers?.dest.join(", ") || "none"}`}
        </text>
        {instruction?.stalled && (
          <text x={10} y={120} fill="red" fontWeight="bold">
            Stalled: Waiting for previous instruction
          </text>
        )}
      </g>
    );
  };



  return (
    <div className="flex w-full flex-col lg:flex-row lg:gap-6">
      {/* Visualization Container - Left side on desktop */}
      <div className="flex w-full flex-col items-center lg:w-2/3">
        <div className="mb-2 w-full flex flex-col justify-between md:flex-row md:items-center">
          <div className="flex items-center space-x-2">
            <span>Slow</span>
            <input
              type="range"
              min="100"
              max="1900"
              value={2000 - speed}
              onChange={handleSpeedChange}
              className="w-40"
            />
            <span>Fast</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <h3 className="text-lg font-medium">
                Current Cycle: {cycles}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-center">
              <div>
                <h3 className="text-lg font-medium">
                  CPI: {cpi} <span className="text-xs text-gray-500">(min: {theoreticalMaxCPI})</span>
                </h3>
              </div>
              <div className="text-xl">|</div>
              <div>
                <h3 className="text-lg font-medium">
                  IPC: {ipc} <span className="text-xs text-gray-500">(max: {theoreticalMaxIPC})</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="mb-4 w-full overflow-hidden rounded-lg border border-gray-300 shadow-lg"
          style={{ height: "500px" }}
        >
          <svg width={svgWidth} height={svgHeight}>
            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Draw X and Y axes */}
              <Axis 
                scale={xScale} 
                orient="bottom" 
                transform={`translate(0,${innerHeight})`} 
                timeLabels={timeLabels}
                label="Clock Cycle"
                labelOffset={{ x: innerWidth / 2, y: 40 }}
              />
              
              <Axis 
                scale={yScale} 
                orient="left" 
                instructions={pipelineInstructions}
                label="Instruction"
                labelOffset={{ x: -innerHeight / 2, y: -80 }}
              />
              
              {/* Render Pipeline Stages */}
              {pipelineInstructions.map((instr) => {
                return (instr.stageHistory || []).map((historyEntry) => {
                  const stageConfig = stageConfigs[historyEntry.stageIndex];
                  if (!stageConfig) return null;

                  // Determine if this history entry is the current, active stage for stall display
                  const isCurrentActiveStage = instr.currentStage === historyEntry.stageIndex;
                  
                  const abbreviation = (isCurrentActiveStage && instr.stalled)
                    ? `${historyEntry.abbreviation}*`
                    : historyEntry.abbreviation;

                  return (
                    <PipelineStage
                      key={`${instr.id}-hist-${historyEntry.stageIndex}-c${historyEntry.entryCycle}`}
                      instruction={instr} // Pass full instruction for stall checks etc.
                      stage={historyEntry.stageIndex}
                      stageName={stageConfig.name} // stageConfig.name is more reliable than historyEntry.name if it existed
                      cycle={historyEntry.entryCycle}
                      cycleLength={historyEntry.duration}
                      xPos={xScale(String(historyEntry.entryCycle))!}
                      yPos={yScale(instr.id.toString())!}
                      width={xScale.bandwidth()!}
                      height={yScale.bandwidth()!}
                      timeLabel={`Cycle ${historyEntry.entryCycle}`}
                      stageImage={ "" } // No icon property on PipelineStageConfig
                      onMouseEnter={handleStageMouseEnter}
                      onMouseLeave={handleStageMouseLeave}
                      color={historyEntry.color} // Use color from history
                      abbreviation={abbreviation}
                    />
                  );
                });
              })}
              
              <Grid 
                scale={xScale} 
                ticks={d3.range(0, cycles + 5)} 
                orientation="vertical" 
                length={innerHeight} 
              />
              
              <Grid 
                scale={yScale} 
                ticks={pipelineInstructions.map(instr => instr.id.toString())} 
                orientation="horizontal" 
                length={innerWidth} 
              />
              
              {/* Custom tooltip for register pipeline */}
              <RegisterPipelineTooltip />
            </g>
          </svg>
        </div>


        {/* Display Legend if enabled */}
        {showLegend && <PipelineStageLegend />}

        {/* Register Values Display */}
        {/* <div className="my-2 w-full border-t border-b border-gray-200 py-4">
          <h3 className="mb-2 text-lg font-medium">Register Values</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {Object.entries(registers).map(([reg, value]) => (
              <div key={reg} className="flex justify-between rounded bg-gray-100 p-2">
                <span className="font-medium">{reg}:</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Controls and Instructions Container - Right side on desktop */}
      <div className="flex w-full flex-col lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Pipeline Controls</h2>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              title="Start"
            >
              Start
            </button>
            <button
              onClick={handlePause}
              disabled={!isRunning}
              className="flex items-center justify-center rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              title="Pause"
            >
              Pause
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              title="Reset"
            >
              Reset
            </button>
            <span className="ml-2 self-center text-sm">
              {pipelineInstructions.every(
                (instr) =>
                  instr.currentStage !== undefined && instr.currentStage >= stageConfigs.length
              )
                ? "Start Over"
                : isRunning ? "Running..." : "Ready"}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 font-semibold">Mode Selection</h3>
            <div className="space-y-3">
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isPipelined}
                  onChange={togglePipelineMode}
                  className="peer sr-only"
                />
                <div className="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                <span className="ml-3 text-sm font-medium">
                  {isPipelined ? "Pipelined Mode" : "Non-pipelined Mode"}
                </span>
              </label>
            </div>
          </div>

          {/* UI Display Controls */}
          <div className="mb-4">
            <h3 className="mb-2 font-semibold">Display Options</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="w-full rounded bg-gray-100 px-3 py-2 text-sm text-left hover:bg-gray-200 flex justify-between items-center"
              >
                <span>{showLegend ? "Hide" : "Show"} Stage Legend</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setShowSystemInfo(!showSystemInfo)}
                className="w-full rounded bg-gray-100 px-3 py-2 text-sm text-left hover:bg-gray-200 flex justify-between items-center"
              >
                <span>{showSystemInfo ? "Hide" : "Show"} System Information</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setStageConfigOpen(!stageConfigOpen)}
                className="w-full rounded bg-gray-100 px-3 py-2 text-sm text-left hover:bg-gray-200 flex justify-between items-center"
              >
                <span>Configure Pipeline Stages</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Instruction Management UI */}
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Instructions</h3>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600"
              >
                {showAddForm ? "Cancel" : "Add Instruction"}
                {!showAddForm && (
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                )}
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 flex flex-col gap-2 rounded bg-gray-50 p-3 md:flex-row">
                <input
                  type="text"
                  value={newInstructionName}
                  onChange={(e) => setNewInstructionName(e.target.value)}
                  placeholder="Enter instruction (e.g., lw x4, 12(x20))"
                  className="flex-grow rounded border border-gray-300 px-3 py-2"
                />
                <button
                  onClick={handleAddInstruction}
                  disabled={!newInstructionName.trim()}
                  className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}

            <div className="max-h-40 overflow-y-auto rounded border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {pipelineInstructions.map((instr) => (
                  <li key={instr.id} className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center">
                      <div
                        className="mr-2 h-4 w-4 rounded-full"
                        style={{ backgroundColor: instr.color }}
                      ></div>
                      <span>
                        <strong>{instr.id}:</strong> {instr.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveInstruction(instr.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove instruction"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Stage Configuration UI */}
        {stageConfigOpen && <PipelineStageConfig />}

        {/* Display System Information if enabled */}
        {showSystemInfo && <SystemInformationPanel />}
      </div>
    </div>
  );
};