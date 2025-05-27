import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Import React components
import { PipelineStage } from "./PipelineStage";
import { PipelineTooltip } from "./PipelineTooltip";
import { Axis } from "./Axis";
import { Grid } from "./Grid";
import { StagePatterns } from "./StagePatterns";
import type { Instruction } from "./types";

// Define the instruction stages with register visualization
const PIPELINE_STAGES = ["Fetch", "Decode", "Execute", "Memory", "Writeback"];
const PIPELINE_REGISTERS = ["IF/ID", "ID/EX", "EX/MEM", "MEM/WB"];

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


interface RegisterPipelineVisualization {
  width?: number;
  height?: number;
  instructions?: Instruction[];
}

export const RegisterPipelineVisualization: React.FC<RegisterPipelineVisualization> = ({
  width,
  height,
  instructions = DEFAULT_INSTRUCTIONS,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(width || 800);
  const [svgHeight, setSvgHeight] = useState<number>(height || 400);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true); // Toggle between pipelined and non-pipelined

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
    setPipelineInstructions(
      instructions.map((instr, index) => {
        if (isPipelined) {
          // Standard pipeline: One instruction per cycle
          return {
            ...instr,
            currentStage: -1, // Not yet in pipeline
            startCycle: index, // Start one cycle after the previous instruction
            stalled: false,
          };
        } else {
          // Non-pipelined mode
          return {
            ...instr,
            currentStage: -1, // Not yet in pipeline
            startCycle: undefined, // Will be set when the instruction starts
            stalled: false,
          };
        }
      })
    );
  }, [instructions]);

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    // Check if all instructions are completed
    const allInstructionsCompleted = pipelineInstructions.every(
      (instr) => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
    );

    if (allInstructionsCompleted) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      // Increment cycle
      setCycles((prev) => prev + 1);

      // Update registers based on completed instructions
      setRegisters((prevRegisters) => {
        const newRegisters = { ...prevRegisters };
        
        // Process instructions that just completed the writeback stage
        pipelineInstructions
          .filter(
            (instr) => 
              instr.currentStage === PIPELINE_STAGES.length - 1 && 
              instr.startCycle !== undefined && 
              instr.startCycle + PIPELINE_STAGES.length - 1 === cycles
          )
          .forEach((instr) => {
            // Update destination registers based on instruction type
            if (instr.name.startsWith("lw ")) {
              // Load instruction: simulate loading from memory
              instr.registers.dest.forEach((reg) => {
                if (reg !== "x0") { // Can't write to x0 in RISC-V
                  // Simulate memory operation: address + offset
                  const srcReg = instr.registers.src[0]; // Base address register
                  const offsetMatch = instr.name.match(/(\d+)\(([^)]+)\)/);
                  const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
                  const memoryAddress = prevRegisters[srcReg] + offset;
                  
                  // Simple simulation: value is address / 4 (arbitrary but deterministic)
                  newRegisters[reg] = Math.floor(memoryAddress / 4);
                }
              });
            } else if (instr.name.startsWith("add ")) {
              // Add instruction: add source registers
              const destReg = instr.registers.dest[0];
              if (destReg !== "x0") { // Can't write to x0
                const [src1, src2] = instr.registers.src;
                newRegisters[destReg] = prevRegisters[src1] + prevRegisters[src2];
              }
            }
            // sw and blt don't update registers in this simple simulation
          });
        
        return newRegisters;
      });

      // Update each instruction's position in the pipeline
      setPipelineInstructions((prevInstructions) => {
        if (isPipelined) {
          // Standard pipelined execution - one instruction can start per cycle
          return prevInstructions.map((instr) => {
            // If the instruction hasn't started yet
            if (instr.startCycle !== undefined && cycles < instr.startCycle) {
              return instr;
            }

            // If the instruction has already completed all stages
            if (
              instr.currentStage !== undefined &&
              instr.currentStage >= PIPELINE_STAGES.length
            ) {
              return instr;
            }

            // Otherwise, advance the instruction to the next stage
            return {
              ...instr,
              currentStage: instr.currentStage !== undefined ? instr.currentStage + 1 : 0,
            };
          });
        } else {
          // Non-pipelined execution - only one instruction can be active at a time
          const activeInstructionIndex = prevInstructions.findIndex(
            (instr) =>
              instr.currentStage !== undefined &&
              instr.currentStage >= 0 &&
              instr.currentStage < PIPELINE_STAGES.length
          );

          if (activeInstructionIndex === -1) {
            // No active instruction, try to start the next one
            const nextInstructionIndex = prevInstructions.findIndex(
              (instr) => instr.currentStage === -1
            );

            if (nextInstructionIndex !== -1) {
              return prevInstructions.map((instr, index) => {
                if (index === nextInstructionIndex) {
                  return { ...instr, currentStage: 0, startCycle: cycles };
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
            updatedInstructions[activeInstructionIndex].currentStage < PIPELINE_STAGES.length - 1
          ) {
            // Simply advance this instruction to the next stage
            updatedInstructions[activeInstructionIndex] = {
              ...updatedInstructions[activeInstructionIndex],
              currentStage: updatedInstructions[activeInstructionIndex].currentStage! + 1,
            };
          } else {
            // This instruction is done, mark it as completed
            updatedInstructions[activeInstructionIndex] = {
              ...updatedInstructions[activeInstructionIndex],
              currentStage: PIPELINE_STAGES.length,
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
              };
            }
          }

          return updatedInstructions;
        }
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, cycles, speed, isPipelined]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCycles(0);
    
    // Reset registers
    setRegisters({
      x0: 0,
      x1: 0,
      x2: 0,
      x3: 0,
      x20: 0x1000,
    });
    
    setPipelineInstructions(
      instructions.map((instr, index) => {
        if (isPipelined) {
          return {
            ...instr,
            currentStage: -1,
            startCycle: index,
            stalled: false,
          };
        } else {
          return {
            ...instr,
            currentStage: -1,
            startCycle: undefined,
            stalled: false,
          };
        }
      })
    );
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
    if (!newInstructionName.trim()) return;

    setIsRunning(false);

    const newInstructionId = pipelineInstructions.length + 1;
    let startCycle;

    if (isPipelined) {
      startCycle = pipelineInstructions.length;
    } else {
      startCycle = undefined;
    }

    // Parse instruction to determine register usage
    let registerInfo = { src: [], dest: [] } as { src: string[], dest: string[] };
    
    // Very basic parsing - should be more robust in a real implementation
    if (newInstructionName.startsWith("lw ")) {
      // Format: lw rd, offset(rs1)
      const parts = newInstructionName.split(/[ ,]+/);
      if (parts.length >= 3) {
        const dest = parts[1];
        const srcMatch = parts[2].match(/\(([^)]+)\)/);
        const src = srcMatch ? srcMatch[1] : "";
        registerInfo = { src: [src], dest: [dest] };
      }
    } else if (newInstructionName.startsWith("sw ")) {
      // Format: sw rs2, offset(rs1)
      const parts = newInstructionName.split(/[ ,]+/);
      if (parts.length >= 3) {
        const src1 = parts[1];
        const srcMatch = parts[2].match(/\(([^)]+)\)/);
        const src2 = srcMatch ? srcMatch[1] : "";
        registerInfo = { src: [src1, src2], dest: [] };
      }
    } else if (newInstructionName.startsWith("add ")) {
      // Format: add rd, rs1, rs2
      const parts = newInstructionName.split(/[ ,]+/);
      if (parts.length >= 4) {
        const dest = parts[1];
        const src1 = parts[2];
        const src2 = parts[3];
        registerInfo = { src: [src1, src2], dest: [dest] };
      }
    } else if (newInstructionName.startsWith("blt ")) {
      // Format: blt rs1, rs2, label
      const parts = newInstructionName.split(/[ ,]+/);
      if (parts.length >= 4) {
        const src1 = parts[1];
        const src2 = parts[2];
        registerInfo = { src: [src1, src2], dest: [] };
      }
    }

    const newInstruction: Instruction = {
      id: newInstructionId,
      name: newInstructionName.trim(),
      color: availableColors[pipelineInstructions.length % availableColors.length],
      registers: registerInfo,
      currentStage: -1,
      startCycle: startCycle,
      stalled: false,
    };

    setPipelineInstructions([...pipelineInstructions, newInstruction]);
    setNewInstructionName("");
    setShowAddForm(false);
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
  const theoreticalMaxCPI = isPipelined ? "1.00" : PIPELINE_STAGES.length.toFixed(2);
  const theoreticalMaxIPC = isPipelined ? "1.00" : (1 / PIPELINE_STAGES.length).toFixed(2);

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

    return (
      <g className="tooltip" transform={`translate(${tooltip.x + 10}, ${tooltip.y - 10})`}>
        <rect
          fill="white"
          stroke="black"
          rx={5}
          ry={5}
          width={220}
          height={90}
          opacity={0.9}
        />
        <text x={10} y={20}>
          {`Instruction: ${tooltip.instructionName}`}
        </text>
        <text x={10} y={40}>
          {`Stage: ${tooltip.stageName} (${tooltip.timeLabel})`}
        </text>
        <text x={10} y={60}>
          {`Source: ${tooltip.registers?.src.join(", ") || "none"}`}
        </text>
        <text x={10} y={80}>
          {`Destination: ${tooltip.registers?.dest.join(", ") || "none"}`}
        </text>
      </g>
    );
  };

  // Create a component for pipeline register lines
  const PipelineRegisterLines = () => {
    if (!isPipelined || cycles === 0) return null;
    
    return (
      <g className="register-lines" opacity={tooltip.visible ? 1 : 0}>
        {PIPELINE_REGISTERS.map((registerName, index) => {
          const xPosition = xScale(String(0))! + xScale.bandwidth() * (index + 1.5);
          
          return (
            <g key={`register-${index}`}>
              <line
                x1={xPosition}
                y1={0}
                x2={xPosition}
                y2={innerHeight}
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text
                x={xPosition}
                y={-10}
                textAnchor="middle"
                fill="#9333ea"
                fontWeight="bold"
              >
                {registerName}
              </text>
            </g>
          );
        })}
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
              
              {/* Draw grid lines */}
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
              
              {/* Draw pipeline register lines (only visible on hover) */}
              <PipelineRegisterLines />
              
              {/* Draw pipeline stages for each instruction */}
              {pipelineInstructions.map((instr) => {
                if (
                  instr.startCycle === undefined ||
                  instr.currentStage === undefined ||
                  instr.currentStage < 0
                ) {
                  return null;
                }

                // Render all stages this instruction has gone through
                return Array.from({ length: Math.min(instr.currentStage, PIPELINE_STAGES.length - 1) + 1 }).map((_, stageIndex) => {
                  const cycle = (instr.startCycle ?? 0) + stageIndex;
                  if (cycle > cycles) return null;

                  const stageName = PIPELINE_STAGES[stageIndex];

                  return (
                    <PipelineStage
                      key={`instr-${instr.id}-stage-${stageIndex}`}
                      instruction={instr}
                      stage={stageIndex}
                      stageName={stageName}
                      cycle={cycle}
                      xPos={xScale(String(cycle))!}
                      yPos={yScale(instr.id.toString())!}
                      width={xScale.bandwidth()}
                      height={yScale.bandwidth()}
                      timeLabel={timeLabels[cycle]}
                      stageImage="" // No stage images for register pipeline
                      onMouseEnter={handleStageMouseEnter}
                      onMouseLeave={handleStageMouseLeave}
                    />
                  );
                });
              })}
              
              {/* Custom tooltip for register pipeline */}
              <RegisterPipelineTooltip />
            </g>
          </svg>
        </div>

        {pipelineInstructions.every(
          (instr) => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
        ) && (
          <div className="mb-4 w-full border-l-4 border-green-400 bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>All done!</strong> All instructions have been completed. It took {cycles} cycles
                  to complete all {pipelineInstructions.length} instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Register Values Display */}
        <div className="my-2 w-full border-t border-b border-gray-200 py-4">
          <h3 className="mb-2 text-lg font-medium">Register Values</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {Object.entries(registers).map(([reg, value]) => (
              <div key={reg} className="flex justify-between rounded bg-gray-100 p-2">
                <span className="font-medium">{reg}:</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
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
                  instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
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
      </div>
    </div>
  );
};
