import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Import SVG assets for controls
import playSvg from "@/assets/play.svg";
import pauseSvg from "@/assets/pause.svg";
import resetSvg from "@/assets/reset.svg";

// Import React components
import { PipelineStage } from "./PipelineStage";
import { PipelineTooltip } from "./PipelineTooltip";
import { Axis } from "./Axis";
import { Grid } from "./Grid";
import { StagePatterns } from "./StagePatterns";
import type { Instruction } from "./types";

// Import configuration
import {
  PIPELINE_STAGES,
  STAGE_IMAGES,
  DEFAULT_INSTRUCTIONS,
  AVAILABLE_COLORS,
  TIMING_CONFIG,
  LAYOUT_CONFIG,
  SUPERSCALAR_CONFIG,
  PERFORMANCE_CONFIG,
  getStageScalingFactor,
  getStageTimingInfo
} from "./config";

interface PipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
  isSuperscalar?: boolean;
  superscalarWidth?: number;
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  width,
  height,
  instructions = DEFAULT_INSTRUCTIONS,
  isSuperscalar = false,
  superscalarWidth = 2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(width || 800);
  const [svgHeight, setSvgHeight] = useState<number>(height || 800);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(TIMING_CONFIG.DEFAULT_SPEED_MS); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true);
  const [isSuperscalarActive, setIsSuperscalarActive] = useState<boolean>(isSuperscalar);
  const [superscalarFactor] = useState<number>(superscalarWidth || SUPERSCALAR_CONFIG.DEFAULT_SUPERSCALAR_WIDTH);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    instructionName: string;
    stageName: string;
    timeLabel: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    instructionName: "",
    stageName: "",
    timeLabel: "",
  });

  // Add instruction state
  const [newInstructionName, setNewInstructionName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Get stage timing information for display
  const stageTimingInfo = getStageTimingInfo();

  // Set initial dimensions based on container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSvgWidth(width);
      setSvgHeight(Math.max(height, 800));
    }
  }, []);

  // Add dimension monitoring
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;

      const { width, height } = entries[0].contentRect;
      setSvgWidth(width);
      setSvgHeight(Math.max(height, LAYOUT_CONFIG.MIN_HEIGHT)); // Minimum height from config
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
        setSvgHeight(Math.max(height, LAYOUT_CONFIG.MIN_HEIGHT));
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
          if (isSuperscalarActive) {
            // For superscalar: Start two instructions per cycle
            return {
              ...instr,
              currentStage: -1, // Not yet in pipeline
              startCycle: Math.floor(index / superscalarFactor), // Start multiple instructions per cycle
              stalled: false,
              registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
            };
          } else {
            // Standard pipeline: One instruction per cycle
            return {
              ...instr,
              currentStage: -1, // Not yet in pipeline
              startCycle: index, // Start one cycle after the previous instruction
              stalled: false,
              registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
            };
          }
        } else {
          // Non-pipelined mode
          return {
            ...instr,
            currentStage: -1, // Not yet in pipeline
            startCycle: undefined, // Will be set when the instruction starts
            stalled: false,
            registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
          };
        }
      })
    );
  }, [instructions, isPipelined, isSuperscalarActive, superscalarFactor]);

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

      // Update each instruction's position in the pipeline
      setPipelineInstructions((prevInstructions) => {
        if (isPipelined) {
          if (isSuperscalarActive) {
            // Superscalar pipelined execution - multiple instructions can start in the same cycle
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
                registers: instr.registers,
              };
            });
          } else {
            // Standard pipelined execution - only one instruction can start per cycle
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
                registers: instr.registers,
              };
            });
          }
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
                  return { ...instr, currentStage: 0, startCycle: cycles, registers: instr.registers };
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
              registers: updatedInstructions[activeInstructionIndex].registers,
            };
          } else {
            // This instruction is done, mark it as completed
            updatedInstructions[activeInstructionIndex] = {
              ...updatedInstructions[activeInstructionIndex],
              currentStage: PIPELINE_STAGES.length,
              registers: updatedInstructions[activeInstructionIndex].registers,
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
                registers: updatedInstructions[nextInstructionIndex].registers,
              };
            }
          }

          return updatedInstructions;
        }
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [isRunning, cycles, speed, isPipelined, isSuperscalarActive]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCycles(0);
    setPipelineInstructions(
      instructions.map((instr, index) => {
        if (isPipelined) {
          if (isSuperscalarActive) {
            return {
              ...instr,
              currentStage: -1,
              startCycle: Math.floor(index / superscalarFactor),
              stalled: false,
              registers: instr.registers,
            };
          } else {
            return {
              ...instr,
              currentStage: -1,
              startCycle: index,
              stalled: false,
              registers: instr.registers,
            };
          }
        } else {
          return {
            ...instr,
            currentStage: -1,
            startCycle: undefined,
            stalled: false,
            registers: instr.registers,
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
    // When toggling to non-pipelined mode, disable superscalar
    if (isPipelined) {
      setIsSuperscalarActive(false);
    }
    handleReset();
  };

  // Add instruction handlers
  const handleAddInstruction = () => {
    if (!newInstructionName.trim()) return;

    setIsRunning(false);

    const newInstructionId = pipelineInstructions.length + 1;
    let startCycle;

    if (isPipelined) {
      if (isSuperscalarActive) {
        // In superscalar mode, multiple instructions can start in the same cycle
        startCycle = Math.floor((newInstructionId - 1) / superscalarFactor);
      } else {
        // In regular pipelined mode, each instruction starts in its own cycle
        startCycle = pipelineInstructions.length;
      }
    } else {
      // In non-pipelined mode, startCycle is undefined until the instruction actually starts
      startCycle = undefined;
    }

    const newInstruction: Instruction = {
      id: newInstructionId,
      name: newInstructionName.trim(),
      color: AVAILABLE_COLORS[pipelineInstructions.length % AVAILABLE_COLORS.length],
      currentStage: -1,
      startCycle: startCycle,
      stalled: false,
      registers: { src: [], dest: [] }, // Add empty registers as this is the laundry simulation
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
        if (isSuperscalarActive) {
          // In superscalar mode, multiple instructions can start in the same cycle
          startCycle = Math.floor(index / superscalarFactor);
        } else {
          // In regular pipelined mode, each instruction starts in its own cycle
          startCycle = index;
        }
      } else {
        // In non-pipelined mode, startCycle is undefined until the instruction actually starts
        startCycle = undefined;
      }

      return {
        ...instr,
        id: newId,
        startCycle: startCycle,
        registers: instr.registers,
      };
    });

    setPipelineInstructions(reindexedInstructions);
    setCycles(0);
  };

  // Convert clock cycles to actual times (starting from config)
  const getTimeLabels = () => {
    return d3.range(0, cycles + 5).map((cycle) => {
      const minutes = cycle * TIMING_CONFIG.CYCLE_DURATION_MINUTES;
      const hours = Math.floor(TIMING_CONFIG.START_TIME_HOUR + minutes / 60);
      const mins = minutes % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours > 12 ? hours - 12 : hours;
      return `${hour12}:${mins === 0 ? "00" : mins} ${ampm}`;
    });
  };

  const getCurrentTimeLabel = () => {
    if (cycles === 0) return `${TIMING_CONFIG.START_TIME_HOUR}:00 AM`;
    
    const minutes = cycles * TIMING_CONFIG.CYCLE_DURATION_MINUTES;
    const hours = Math.floor(TIMING_CONFIG.START_TIME_HOUR + minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours > 12 ? hours - 12 : hours;
    return `${hour12}:${mins === 0 ? "00" : mins} ${ampm}`;
  };

  // Calculate laundry loads per hour performance metric
  // This shows how many loads of laundry can be completed per hour
  const completedInstructions = pipelineInstructions.filter(
    instr => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
  ).length;
  
  // Convert cycles to hours and calculate loads per hour
  const currentTimeInHours = cycles > 0 ? (cycles * TIMING_CONFIG.CYCLE_DURATION_MINUTES) / 60 : 0;
  const loadsPerHour = currentTimeInHours > 0 
    ? (completedInstructions / currentTimeInHours).toFixed(PERFORMANCE_CONFIG.METRIC_DISPLAY_PRECISION) 
    : "0.0";
  
  // Theoretical maximum loads per hour calculation
  // In pipelined mode: 1 load per cycle after initial fill
  // In non-pipelined mode: 1 load per (number of stages) cycles
  const cyclesPerHour = 60 / TIMING_CONFIG.CYCLE_DURATION_MINUTES; // How many cycles in an hour
  const theoreticalMaxLoadsPerHour = isPipelined
    ? isSuperscalarActive
      ? (cyclesPerHour * superscalarFactor).toFixed(PERFORMANCE_CONFIG.METRIC_DISPLAY_PRECISION) // Multiple loads can start per cycle
      : cyclesPerHour.toFixed(PERFORMANCE_CONFIG.METRIC_DISPLAY_PRECISION) // One load per cycle
    : (cyclesPerHour / PIPELINE_STAGES.length).toFixed(PERFORMANCE_CONFIG.METRIC_DISPLAY_PRECISION); // One load every N cycles

  // Set up D3 scales for our chart
  const margin = LAYOUT_CONFIG.MARGINS;
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  // X scale for cycles
  const xScale = d3
    .scaleBand()
    .domain(d3.range(0, cycles + 5).map(String))
    .range([0, innerWidth])
    .padding(LAYOUT_CONFIG.BAND_PADDING.cycles);

  // Y scale for instructions
  const yScale = d3
    .scaleBand()
    .domain(pipelineInstructions.map((instr) => instr.id.toString()))
    .range([0, innerHeight])
    .padding(LAYOUT_CONFIG.BAND_PADDING.instructions);

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
    });
  };

  const handleStageMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="flex w-full flex-col xl:flex-row xl:gap-6">
      {/* Visualization Container - Left side on desktop */}
      <div className="flex w-full flex-col items-center xl:w-3/4">
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
                Current Time: {getCurrentTimeLabel()}
                <span className="text-xs text-gray-500"> (Cycle: {cycles})</span>
              </h3>
            </div>

            <div className="flex items-center gap-2 text-center">
              <div>
                <h3 className="text-lg font-medium">
                  {PERFORMANCE_CONFIG.LOADS_PER_HOUR_LABEL}: {loadsPerHour} <span className="text-xs text-gray-500">(max: {theoreticalMaxLoadsPerHour})</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="mb-4 w-full overflow-hidden rounded-lg border border-gray-300 shadow-lg"
          style={{ height: `${LAYOUT_CONFIG.CONTAINER_HEIGHT}px` }}
        >
          <svg width={svgWidth} height={svgHeight}>
            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Define patterns for stage icons */}
              <StagePatterns stageImages={STAGE_IMAGES} />
              
              {/* Draw X and Y axes */}
              <Axis 
                scale={xScale} 
                orient="bottom" 
                transform={`translate(0,${innerHeight})`} 
                timeLabels={timeLabels}
                label="Clock Cycle"
                labelOffset={{ x: innerWidth / 2, y: 65 }}
              />
              
              <Axis 
                scale={yScale} 
                orient="left" 
                instructions={pipelineInstructions}
                label="Laundry Load"
                labelOffset={{ x: -innerHeight / 2, y: -90 }}
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
                  const cycle = (instr.startCycle || 0) + stageIndex;
                  if (cycle > cycles) return null;

                  const stageName = PIPELINE_STAGES[stageIndex];
                  
                  // For superscalar badge, check if there are multiple instructions in this cycle
                  const parallelInstructions = isSuperscalarActive && stageIndex === 0
                    ? pipelineInstructions.filter(i => i.startCycle === instr.startCycle)
                    : [];
                  
                  const isFirstInGroup = parallelInstructions.length > 0 && 
                    instr.id === parallelInstructions[0].id;

                  return (
                    <PipelineStage
                      key={`instr-${instr.id}-stage-${stageIndex}`}
                      instruction={instr}
                      stage={stageIndex}
                      stageName={stageName}
                      cycle={cycle}
                      cycleLength={getStageScalingFactor(stageIndex)}
                      xPos={xScale(String(cycle))!}
                      yPos={yScale(instr.id.toString())!}
                      width={xScale.bandwidth()}
                      height={yScale.bandwidth()}
                      timeLabel={timeLabels[cycle]}
                      stageImage={STAGE_IMAGES[stageIndex]}
                      onMouseEnter={handleStageMouseEnter}
                      onMouseLeave={handleStageMouseLeave}
                      isSuperscalarActive={isSuperscalarActive}
                      parallelInstructions={parallelInstructions}
                      isFirstInGroup={isFirstInGroup}
                    />
                  );
                });
              })}
              
              {/* Tooltip */}
              {tooltip.visible && (
                <PipelineTooltip
                  x={tooltip.x}
                  y={tooltip.y}
                  instructionName={tooltip.instructionName}
                  stageName={tooltip.stageName}
                  timeLabel={tooltip.timeLabel}
                />
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Controls and Instructions Container - Right side on desktop */}
      <div className="flex w-full flex-col xl:w-1/4 xl:sticky xl:top-4 xl:self-start">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Pipeline Controls</h2>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              title="Start"
            >
              <img src={playSvg} alt="Start" className="h-6 w-6" />
            </button>
            <button
              onClick={handlePause}
              disabled={!isRunning}
              className="flex items-center justify-center rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              title="Pause"
            >
              <img src={pauseSvg} alt="Pause" className="h-6 w-6" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              title="Reset"
            >
              <img src={resetSvg} alt="Reset" className="h-6 w-6" />
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

              {/* Superscalar toggle, only available in pipelined mode */}
              {isPipelined && (
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isSuperscalarActive}
                    onChange={() => {
                      setIsSuperscalarActive(!isSuperscalarActive);
                      handleReset();
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-purple-600 peer-focus:ring-4 peer-focus:ring-purple-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  <span className="ml-3 text-sm font-medium">
                    {isSuperscalarActive ? (
                      <span className="flex items-center gap-2">
                        Superscalar Mode ({superscalarFactor}-way)
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                          {superscalarFactor}x
                        </span>
                      </span>
                    ) : (
                      "Superscalar Mode"
                    )}
                  </span>
                </label>
              )}
            </div>
          </div>
          
          {/* <div className="mb-4">
            <h3 className="mb-2 font-semibold">Stage Timing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Clock Period:</span>
                <span>{stageTimingInfo.clockPeriod} time units</span>
              </div>
              <div className="space-y-1">
                <div className="font-medium">Stage Durations:</div>
                {PIPELINE_STAGES.map((stageName, index) => {
                  const length = stageTimingInfo.stageLengths[index];
                  const scalingFactor = stageTimingInfo.stageScalingFactors[index];
                  return (
                    <div key={index} className="flex justify-between text-xs pl-2">
                      <span>{stageName}:</span>
                      <span>{length} units ({(scalingFactor * 100).toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div> */}
          
          {/* Visual Symbols Legend */}
          <div className="mb-4">
            <h3 className="mb-2 font-semibold">Visual Elements Legend</h3>
            <div className="space-y-3 text-sm">
              
              {/* Stage Icons Section */}
              <div>
                <div className="font-medium mb-2">Pipeline Stages:</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {PIPELINE_STAGES.map((stageName, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 rounded bg-gray-50">
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white">
                        <img 
                          src={STAGE_IMAGES[index]} 
                          alt={stageName} 
                          className="h-6 w-6"
                        />
                      </div>
                      <span className="text-xs">{stageName}</span>
                      <span className="text-xs">{stageTimingInfo.stageLengths[index]} mins</span>
                    </div>
                  ))}
                </div>
              </div>
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
                  placeholder="Enter laundry load (e.g., Sweaters Load)"
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
