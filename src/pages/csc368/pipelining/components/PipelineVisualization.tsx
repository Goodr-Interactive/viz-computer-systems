import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";

// Import SVG assets for controls
import resetSvg from "@/assets/reset.svg";

// Import React components
import { PipelineStage } from "./PipelineStage";
import { PipelineTooltip } from "./PipelineTooltip";
import { MetricTooltip } from "./MetricTooltip";
import { Axis } from "./Axis";
import { Grid } from "./Grid";
import { StagePatterns } from "./StagePatterns";
import type { Instruction } from "./types";

// Import configuration
import {
  PIPELINE_STAGES,
  STAGE_IMAGES,
  STAGE_COLORS,
  STAGE_ABBREVIATIONS,
  DEFAULT_INSTRUCTIONS,
  AVAILABLE_COLORS,
  TIMING_CONFIG,
  LAYOUT_CONFIG,
  PERFORMANCE_CONFIG,
  getStageScalingFactor,
  FEATURE_FLAGS,
} from "./config";

interface PipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
  superscalarWidth?: number;
  pipelined?: boolean;
  compact?: boolean; // Add compact mode prop
  stageWidth?: number; // Custom stage width
  stageHeight?: number; // Custom stage height
  externalControl?: boolean; // Disable internal auto-run when controlled externally
}

// Define the ref interface
export interface PipelineVisualizationRef {
  stepForward: () => void;
  toggleRun: () => void;
  reset: () => void;
  getCycles: () => number;
  getIsRunning: () => boolean;
}

export const PipelineVisualization = forwardRef<
  PipelineVisualizationRef,
  PipelineVisualizationProps
>(
  (
    {
      width,
      height,
      instructions = DEFAULT_INSTRUCTIONS, // show only a subset of default instructions
      pipelined = FEATURE_FLAGS.IS_PIPELINED_MODE,
      compact = false, // Add compact mode with default false
      stageWidth: customStageWidth, // Custom stage width
      stageHeight: customStageHeight, // Custom stage height
      externalControl = false, // Disable internal auto-run when controlled externally
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgWidth, setSvgWidth] = useState<number>(width || 800);
    const [svgHeight, setSvgHeight] = useState<number>(height || 800);
    const [cycles, setCycles] = useState<number>(-1);
    const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [simulationSpeed, setSimulationSpeed] = useState<number>(TIMING_CONFIG.DEFAULT_SPEED_MS);
    const [isPipelined, setIsPipelined] = useState<boolean>(pipelined);
    const [isSuperscalarActive, setIsSuperscalarActive] = useState<boolean>(
      FEATURE_FLAGS.IS_SUPERSCALAR_MODE
    );
    const [superscalarFactor] = useState<number>(FEATURE_FLAGS.DEFAULT_SUPERSCALAR_WIDTH);
    const [tooltip, setTooltip] = useState<{
      visible: boolean;
      x: number;
      y: number;
      instructionName: string;
      stageName: string;
      timeLabel: string;
      endTimeLabel: string;
    }>({
      visible: false,
      x: 0,
      y: 0,
      instructionName: "",
      stageName: "",
      timeLabel: "",
      endTimeLabel: "",
    });

    // Metric tooltip state
    const [metricTooltip, setMetricTooltip] = useState<{
      visible: boolean;
      x: number;
      y: number;
    }>({
      visible: false,
      x: 0,
      y: 0,
    });

    // Add instruction state
    const [newInstructionName, setNewInstructionName] = useState<string>("");
    const [showAddForm, setShowAddForm] = useState<boolean>(false);

    // Set initial dimensions based on container size
    useEffect(() => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setSvgWidth(width);
        setSvgHeight(Math.max(height, 800));
      }
    }, []);

    // Add dimension monitoring
    // Get layout configuration based on compact mode
    const layoutConfig = compact ? LAYOUT_CONFIG.COMPACT_MODE : LAYOUT_CONFIG;

    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries.length) return;

        const { width, height } = entries[0].contentRect;
        setSvgWidth(width);
        setSvgHeight(Math.max(height, layoutConfig.MIN_HEIGHT)); // Use layout config
      });

      resizeObserver.observe(containerRef.current);

      // Clean up
      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Update dimensions when props change
    useEffect(() => {
      if (width !== undefined) {
        setSvgWidth(width);
      }
      if (height !== undefined) {
        setSvgHeight(height);
      }
    }, [width, height]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setSvgWidth(width);
          setSvgHeight(Math.max(height, layoutConfig.MIN_HEIGHT));
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
                currentStage: 0, // Not yet in pipeline (1-based: stages 1-5)
                startCycle: Math.floor(index / superscalarFactor), // Start multiple instructions per cycle
                stalled: false,
                isCompleted: false, // New completion flag
                registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
              };
            } else {
              // Standard pipeline: One instruction per cycle
              return {
                ...instr,
                currentStage: 0, // Not yet in pipeline (1-based: stages 1-5)
                startCycle: index, // Start one cycle after the previous instruction
                stalled: false,
                isCompleted: false, // New completion flag
                registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
              };
            }
          } else {
            // Non-pipelined mode
            return {
              ...instr,
              currentStage: 0, // Not yet in pipeline (1-based: stages 1-5)
              startCycle: undefined, // Will be set when the instruction starts
              stalled: false,
              isCompleted: false, // New completion flag
              registers: instr.registers || { src: [], dest: [] }, // Ensure registers property exists
            };
          }
        })
      );
    }, [instructions, isPipelined, isSuperscalarActive, superscalarFactor]);

    // Simulation logic (autoplay mode on)
    useEffect(() => {
      // Don't auto-run if controlled externally
      if (externalControl || !isRunning) return;

      // Check if all instructions are completed
      const allInstructionsCompleted = pipelineInstructions.every(
        (instr) => instr.isCompleted === true
      );

      if (allInstructionsCompleted) {
        setIsRunning(false);
        return;
      }

      const timer = setTimeout(() => {
        // Increment cycle
        const nextCycles = cycles + 1;
        setCycles(nextCycles);

        // Update each instruction's position in the pipeline
        setPipelineInstructions((prevInstructions) => {
          if (isPipelined) {
            if (isSuperscalarActive) {
              // Superscalar pipelined execution - multiple instructions can start in the same cycle
              return prevInstructions.map((instr) => {
                // If the instruction hasn't started yet
                if (instr.startCycle !== undefined && nextCycles < instr.startCycle) {
                  return instr;
                }

                // If the instruction has already completed all stages
                if (instr.isCompleted) {
                  return instr;
                }

                // Otherwise, advance the instruction to the next stage
                const nextStage = instr.currentStage !== undefined ? instr.currentStage + 1 : 1;
                const completed = nextStage > PIPELINE_STAGES.length;

                return {
                  ...instr,
                  currentStage: completed ? PIPELINE_STAGES.length : nextStage,
                  isCompleted: completed,
                  registers: instr.registers,
                };
              });
            } else {
              // Standard pipelined execution - only one instruction can start per cycle
              return prevInstructions.map((instr) => {
                // If the instruction hasn't started yet
                if (instr.startCycle !== undefined && nextCycles < instr.startCycle) {
                  return instr;
                }

                // If the instruction has already completed all stages
                if (instr.isCompleted) {
                  return instr;
                }

                // Otherwise, advance the instruction to the next stage
                const nextStage = instr.currentStage !== undefined ? instr.currentStage + 1 : 1;
                const completed = nextStage > PIPELINE_STAGES.length;

                return {
                  ...instr,
                  currentStage: completed ? PIPELINE_STAGES.length : nextStage,
                  isCompleted: completed,
                  registers: instr.registers,
                };
              });
            }
          } else {
            // Non-pipelined execution - only one instruction can be active at a time
            const activeInstructionIndex = prevInstructions.findIndex(
              (instr) =>
                instr.currentStage !== undefined &&
                instr.currentStage >= 1 &&
                instr.currentStage <= PIPELINE_STAGES.length &&
                !instr.isCompleted
            );

            if (activeInstructionIndex === -1) {
              // No active instruction, try to start the next one
              const nextInstructionIndex = prevInstructions.findIndex(
                (instr) => instr.currentStage === 0 && !instr.isCompleted
              );

              if (nextInstructionIndex !== -1) {
                return prevInstructions.map((instr, index) => {
                  if (index === nextInstructionIndex) {
                    return {
                      ...instr,
                      currentStage: 1,
                      startCycle: nextCycles,
                      registers: instr.registers,
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
              updatedInstructions[activeInstructionIndex].currentStage < PIPELINE_STAGES.length
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
                isCompleted: true,
                registers: updatedInstructions[activeInstructionIndex].registers,
              };

              // Immediately start the next instruction if available
              const nextInstructionIndex = updatedInstructions.findIndex(
                (instr) => instr.currentStage === 0 && !instr.isCompleted
              );

              if (nextInstructionIndex !== -1) {
                updatedInstructions[nextInstructionIndex] = {
                  ...updatedInstructions[nextInstructionIndex],
                  currentStage: 1,
                  startCycle: nextCycles,
                  registers: updatedInstructions[nextInstructionIndex].registers,
                };
              }
            }

            return updatedInstructions;
          }
        });
      }, simulationSpeed); // Use configurable simulation speed

      return () => clearTimeout(timer);
    }, [isRunning, cycles, isPipelined, isSuperscalarActive, simulationSpeed]);

    const handleStepForward = () => {
      // Check if all instructions are completed
      const allInstructionsCompleted = pipelineInstructions.every(
        (instr) => instr.isCompleted === true
      );

      if (allInstructionsCompleted) {
        return; // Don't step if all instructions are completed
      }

      // Manually advance one cycle
      const newCycles = cycles + 1;
      setCycles(newCycles);

      // Update each instruction's position in the pipeline (same logic as the useEffect)
      setPipelineInstructions((prevInstructions) => {
        if (isPipelined) {
          if (isSuperscalarActive) {
            // Superscalar pipelined execution - multiple instructions can start in the same cycle
            return prevInstructions.map((instr) => {
              // If the instruction hasn't started yet
              if (instr.startCycle !== undefined && newCycles < instr.startCycle) {
                return instr;
              }

              // If the instruction has already completed all stages
              if (instr.isCompleted) {
                return instr;
              }

              // Otherwise, advance the instruction to the next stage
              const nextStage = instr.currentStage !== undefined ? instr.currentStage + 1 : 1;
              const completed = nextStage > PIPELINE_STAGES.length;

              return {
                ...instr,
                currentStage: completed ? PIPELINE_STAGES.length : nextStage,
                isCompleted: completed,
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
              if (instr.isCompleted) {
                return instr;
              }

              // Otherwise, advance the instruction to the next stage
              const nextStage = instr.currentStage !== undefined ? instr.currentStage + 1 : 1;
              const completed = nextStage >= PIPELINE_STAGES.length;

              return {
                ...instr,
                currentStage: completed ? PIPELINE_STAGES.length : nextStage,
                isCompleted: completed,
                registers: instr.registers,
              };
            });
          }
        } // if not pipelined
        else {
          // Non-pipelined execution - only one instruction can be active at a time
          const activeInstructionIndex = prevInstructions.findIndex(
            (instr) =>
              instr.currentStage !== undefined &&
              instr.currentStage >= 1 &&
              instr.currentStage <= PIPELINE_STAGES.length &&
              !instr.isCompleted
          );

          if (activeInstructionIndex === -1) {
            // No active instruction, try to start the next one
            const nextInstructionIndex = prevInstructions.findIndex(
              (instr) => instr.currentStage === 0 && !instr.isCompleted
            );

            if (nextInstructionIndex !== -1) {
              return prevInstructions.map((instr, index) => {
                if (index === nextInstructionIndex) {
                  return {
                    ...instr,
                    currentStage: 1,
                    startCycle: newCycles,
                    registers: instr.registers,
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
            updatedInstructions[activeInstructionIndex].currentStage < PIPELINE_STAGES.length
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
              isCompleted: true,
              registers: updatedInstructions[activeInstructionIndex].registers,
            };

            // Immediately start the next instruction if available
            const nextInstructionIndex = updatedInstructions.findIndex(
              (instr) => instr.currentStage === 0 && !instr.isCompleted
            );

            if (nextInstructionIndex !== -1) {
              updatedInstructions[nextInstructionIndex] = {
                ...updatedInstructions[nextInstructionIndex],
                currentStage: 1,
                startCycle: newCycles,
                registers: updatedInstructions[nextInstructionIndex].registers,
              };
            }
          }

          return updatedInstructions;
        }
      });
    };

    const handleReset = () => {
      setIsRunning(false);
      setCycles(-1);
      setPipelineInstructions(
        instructions.map((instr, index) => {
          if (isPipelined) {
            if (isSuperscalarActive) {
              return {
                ...instr,
                currentStage: 0,
                startCycle: Math.floor(index / superscalarFactor),
                stalled: false,
                isCompleted: false,
                registers: instr.registers,
              };
            } else {
              return {
                ...instr,
                currentStage: 0,
                startCycle: index,
                stalled: false,
                isCompleted: false,
                registers: instr.registers,
              };
            }
          } else {
            return {
              ...instr,
              currentStage: 0,
              startCycle: undefined,
              stalled: false,
              isCompleted: false,
              registers: instr.registers,
            };
          }
        })
      );
    };

    // Expose methods through ref for parent component control
    useImperativeHandle(ref, () => ({
      stepForward: handleStepForward,
      toggleRun: () => setIsRunning((prev) => !prev),
      reset: handleReset,
      getCycles: () => cycles,
      getIsRunning: () => isRunning,
    }));

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
        currentStage: 0,
        startCycle: startCycle,
        stalled: false,
        isCompleted: false,
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

    // Calculate the maximum cycle needed to show all instruction stages
    const getMaxCycleNeeded = () => {
      if (pipelineInstructions.length === 0) return Math.max(0, cycles);

      // Calculate theoretical maximum cycles needed for both execution modes
      // to ensure consistent axis labels when comparing sequential vs pipelined
      const pipelinedMaxCycle = pipelineInstructions.length - 1 + PIPELINE_STAGES.length - 1;
      const sequentialMaxCycle = pipelineInstructions.length * PIPELINE_STAGES.length - 1;

      // Use the maximum of both modes to ensure consistent comparison
      // This way both visualizations show the full time range
      const theoreticalMaxCycle = Math.max(pipelinedMaxCycle, sequentialMaxCycle);

      // Check if all instructions are completed
      const allInstructionsCompleted = pipelineInstructions.every(
        (instr) => instr.isCompleted === true
      );

      // Calculate actual max cycle from completed/started instructions
      let actualMaxCycle = 0;
      pipelineInstructions.forEach((instr) => {
        if (instr.startCycle !== undefined) {
          // Calculate when this instruction will complete all stages
          const completionCycle = instr.startCycle + PIPELINE_STAGES.length - 1;
          actualMaxCycle = Math.max(actualMaxCycle, completionCycle);
        }
      });

      // If all instructions are completed, still show the full theoretical range
      // for consistent comparison between sequential and pipelined modes
      if (allInstructionsCompleted) {
        return theoreticalMaxCycle;
      }

      // Always show the theoretical maximum to ensure consistent axis labels
      // but also account for current simulation state
      const currentMaxCycle = Math.max(theoreticalMaxCycle, actualMaxCycle);

      // If simulation is running, show current cycle + small buffer for next operations
      if (isRunning) {
        return Math.max(currentMaxCycle, cycles + 1);
      }

      // If simulation is paused but not complete, show the full theoretical range
      return Math.max(currentMaxCycle, cycles);
    };

    // Convert clock cycles to time periods (classic H&P example format)
    const getTimeLabels = () => {
      const maxCycle = getMaxCycleNeeded();
      return d3.range(0, maxCycle + 1).map((cycle) => {
        const totalMinutes =
          TIMING_CONFIG.START_TIME_HOUR * 60 + cycle * TIMING_CONFIG.CYCLE_DURATION_MINUTES;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const hours24 = hours % 24; // Handle day rollover
        const ampm = hours24 >= 12 ? "PM" : "AM";
        const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
        return minutes === 0
          ? `${hour12} ${ampm}`
          : `${hour12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
      });
    };

    const getCurrentTimeLabel = () => {
      if (cycles === -1) return `Not Started`;

      // Check if all instructions are completed
      const allInstructionsCompleted = pipelineInstructions.every(
        (instr) => instr.isCompleted === true
      );

      let cycleToUse = cycles;

      // If all instructions are completed, show time based on actual completion
      if (allInstructionsCompleted && pipelineInstructions.length > 0) {
        let maxCompletionCycle = 0;
        pipelineInstructions.forEach((instr) => {
          if (instr.startCycle !== undefined) {
            const completionCycle = instr.startCycle + PIPELINE_STAGES.length - 1;
            maxCompletionCycle = Math.max(maxCompletionCycle, completionCycle);
          }
        });
        // Use the actual completion cycle + 1 for final time display
        cycleToUse = maxCompletionCycle + 1;
      }

      // Calculate time based on cycle and cycle duration
      const totalMinutes =
        TIMING_CONFIG.START_TIME_HOUR * 60 + cycleToUse * TIMING_CONFIG.CYCLE_DURATION_MINUTES;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const hours24 = hours % 24; // Handle day rollover
      const ampm = hours24 >= 12 ? "PM" : "AM";
      const hour12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      return minutes === 0
        ? `${hour12} ${ampm}`
        : `${hour12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
    };

    // Calculate laundry loads per hour performance metric
    // This shows how many loads of laundry can be completed per hour
    const completedInstructions = pipelineInstructions.filter(
      (instr) => instr.isCompleted === true
    ).length;

    // Convert cycles to hours and calculate loads per hour
    const currentTimeInHours =
      cycles > 0 ? (cycles * TIMING_CONFIG.CYCLE_DURATION_MINUTES) / 60 : 0;
    const loadsPerHour =
      currentTimeInHours > 0
        ? (completedInstructions / currentTimeInHours).toFixed(
            PERFORMANCE_CONFIG.METRIC_DISPLAY_PRECISION
          )
        : "0.0";

    // Set up D3 scales for our chart
    const margin = layoutConfig.MARGINS;
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    // X scale for cycles - use fixed bandwidth in compact mode to prevent stretching
    const maxCycle = getMaxCycleNeeded();

    // Use custom stage dimensions if provided, otherwise fall back to defaults
    const effectiveStageWidth =
      customStageWidth || (compact ? LAYOUT_CONFIG.COMPACT_MODE.STAGE_WIDTH : 60);
    const effectiveStageHeight =
      customStageHeight ||
      (compact ? LAYOUT_CONFIG.COMPACT_MODE.STAGE_HEIGHT : effectiveStageWidth);

    const xScale = compact
      ? d3
          .scaleBand()
          .domain(d3.range(0, maxCycle + 1).map(String))
          .range([0, innerWidth]) // Use available inner width instead of expanding
          .padding(layoutConfig.BAND_PADDING.cycles)
      : d3
          .scaleBand()
          .domain(d3.range(0, maxCycle + 1).map(String))
          .range([0, innerWidth])
          .padding(layoutConfig.BAND_PADDING.cycles);

    // Y scale for instructions - use custom height if provided
    const yScale =
      (compact || customStageHeight) && effectiveStageHeight
        ? d3
            .scaleBand()
            .domain(pipelineInstructions.map((instr) => instr.id.toString()))
            .range([0, pipelineInstructions.length * effectiveStageHeight])
            .padding(layoutConfig.BAND_PADDING.instructions)
        : d3
            .scaleBand()
            .domain(pipelineInstructions.map((instr) => instr.id.toString()))
            .range([0, innerHeight])
            .padding(layoutConfig.BAND_PADDING.instructions);

    const timeLabels = getTimeLabels();

    // Handle tooltip display
    const handleStageMouseEnter = (
      event: React.MouseEvent,
      instruction: Instruction,
      stageName: string,
      timeLabel: string
    ) => {
      // Get the SVG element to calculate proper coordinates
      const svgElement = containerRef.current?.querySelector("svg");
      if (!svgElement) return;

      // Get SVG bounding rect for coordinate conversion
      const svgRect = svgElement.getBoundingClientRect();

      // Convert mouse position to SVG coordinates
      const svgX = event.clientX - svgRect.left - margin.left;
      const svgY = event.clientY - svgRect.top - margin.top;

      // Calculate end time for this stage
      const stageIndex = PIPELINE_STAGES.indexOf(stageName);
      const stageCycle = (instruction.startCycle || 0) + stageIndex;
      const endCycle = stageCycle + 1; // Each stage lasts one cycle

      // Calculate end time label
      const endTotalMinutes =
        TIMING_CONFIG.START_TIME_HOUR * 60 + endCycle * TIMING_CONFIG.CYCLE_DURATION_MINUTES;
      const endHours = Math.floor(endTotalMinutes / 60);
      const endMinutes = endTotalMinutes % 60;
      const endHours24 = endHours % 24;
      const endAmpm = endHours24 >= 12 ? "PM" : "AM";
      const endHour12 = endHours24 === 0 ? 12 : endHours24 > 12 ? endHours24 - 12 : endHours24;
      const endTimeLabel =
        endMinutes === 0
          ? `${endHour12} ${endAmpm}`
          : `${endHour12}:${endMinutes < 10 ? "0" : ""}${endMinutes} ${endAmpm}`;

      setTooltip({
        visible: true,
        x: svgX,
        y: svgY,
        instructionName: instruction.name,
        stageName,
        timeLabel,
        endTimeLabel,
      });
    };

    const handleStageMouseLeave = () => {
      setTooltip({ ...tooltip, visible: false });
    };

    return (
      <div className={`flex w-full flex-col ${compact ? "" : "xl:flex-row xl:gap-6"}`}>
        {/* Visualization Container - Left side on desktop */}
        <div className={`flex w-full flex-col items-center ${compact ? "" : "xl:w-3/4"}`}>
          {/* Header with time and metrics - hidden in compact mode */}
          {!compact && (
            <div className="mb-2 flex w-full flex-col justify-between md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    Current Time: {getCurrentTimeLabel()}
                    <span className="text-xs text-gray-500"> (Cycle: {cycles})</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-center">
                  <div>
                    <h3
                      className="relative cursor-help text-lg font-medium"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMetricTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => {
                        setMetricTooltip({ visible: false, x: 0, y: 0 });
                      }}
                    >
                      {PERFORMANCE_CONFIG.LOADS_PER_HOUR_LABEL}: {loadsPerHour}{" "}
                      <span className="text-xs text-gray-500"></span>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className={`mb-4 w-full overflow-hidden rounded-lg border border-gray-300 shadow-lg`}
            style={{ height: `${height || svgHeight || layoutConfig.CONTAINER_HEIGHT}px` }}
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
                  label="Time"
                  labelOffset={{ x: innerWidth / 2, y: 65 }}
                />

                <Axis
                  scale={yScale}
                  orient="left"
                  instructions={pipelineInstructions}
                  label="Task Order"
                  labelOffset={{ x: -innerHeight / 2, y: -90 }}
                />

                {/* Draw grid lines */}
                <Grid
                  scale={xScale}
                  ticks={d3.range(0, maxCycle + 1)}
                  orientation="vertical"
                  length={innerHeight}
                />

                <Grid
                  scale={yScale}
                  ticks={pipelineInstructions.map((instr) => instr.id.toString())}
                  orientation="horizontal"
                  length={innerWidth}
                />

                {/* Current cycle indicator line if feature flag is on */}
                {FEATURE_FLAGS.SHOW_CYCLES_INDICATOR && cycles >= 0 && (
                  <line
                    x1={xScale(String(cycles - 1))! + xScale.bandwidth()}
                    y1={0}
                    x2={xScale(String(cycles - 1))! + xScale.bandwidth()}
                    y2={innerHeight}
                    stroke="#FF6B35"
                    strokeWidth={3}
                    strokeDasharray="5,5"
                    opacity={0.8}
                    style={{
                      filter: "drop-shadow(0px 0px 3px rgba(255, 107, 53, 0.3))",
                    }}
                  />
                )}

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
                  return Array.from({
                    length: Math.min(instr.currentStage, PIPELINE_STAGES.length - 1) + 1,
                  }).map((_, stageIndex) => {
                    const cycle = (instr.startCycle || 0) + stageIndex;
                    if (cycle > cycles) return null;

                    const stageName = PIPELINE_STAGES[stageIndex];

                    // For superscalar badge, check if there are multiple instructions in this cycle
                    const parallelInstructions =
                      isSuperscalarActive && stageIndex === 0
                        ? pipelineInstructions.filter((i) => i.startCycle === instr.startCycle)
                        : [];

                    const isFirstInGroup =
                      parallelInstructions.length > 0 && instr.id === parallelInstructions[0].id;

                    // Calculate stage dimensions - use custom sizes if provided, otherwise use scale bandwidth
                    const stageWidthToUse = customStageWidth || xScale.bandwidth();
                    const stageHeightToUse = customStageHeight || yScale.bandwidth();

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
                        width={stageWidthToUse}
                        height={stageHeightToUse}
                        timeLabel={timeLabels[cycle]}
                        stageImage={STAGE_IMAGES[stageIndex]}
                        color={STAGE_COLORS[stageIndex]}
                        abbreviation={compact ? STAGE_ABBREVIATIONS[stageIndex] : undefined}
                        onMouseEnter={handleStageMouseEnter}
                        onMouseLeave={handleStageMouseLeave}
                        isSuperscalarActive={isSuperscalarActive}
                        parallelInstructions={parallelInstructions}
                        isFirstInGroup={isFirstInGroup}
                        compact={compact}
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
                    endTimeLabel={tooltip.endTimeLabel}
                    svgWidth={svgWidth}
                    svgHeight={svgHeight}
                    margin={margin}
                  />
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* Controls and Instructions Container - Right side on desktop */}
        {!compact && (
          <div className="flex w-full flex-col xl:sticky xl:top-4 xl:w-1/4 xl:self-start">
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Pipeline Controls</h2>
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  onClick={handleStepForward}
                  disabled={pipelineInstructions.every((instr) => instr.isCompleted === true)}
                  className="flex items-center justify-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
                  title="Step Forward One Cycle"
                >
                  <span className="text-sm font-medium">Forward →</span>
                </button>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  disabled={pipelineInstructions.every((instr) => instr.isCompleted === true)}
                  className={`flex items-center justify-center rounded px-4 py-2 text-white disabled:opacity-50 ${
                    isRunning
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  title={isRunning ? "Pause Auto Run" : "Run Automatically"}
                >
                  <span className="text-sm font-medium">{isRunning ? "Pause" : "Auto"}</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                  title="Reset to Beginning"
                >
                  <img src={resetSvg} alt="Reset" className="h-6 w-6" />
                </button>
                <span className="ml-2 self-center text-sm">
                  {pipelineInstructions.every((instr) => instr.isCompleted === true)
                    ? "All Complete"
                    : isRunning
                      ? "Running..."
                      : "Ready"}
                </span>
              </div>

              {/* Speed Control */}
              <div className="mb-4">
                <h3 className="mb-2 font-semibold">Simulation Speed</h3>
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                >
                  {TIMING_CONFIG.SPEED_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Selection */}
              {FEATURE_FLAGS.SHOW_MODE_SELECTION && (
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold">Execution Mode</h3>
                  <div className="space-y-3">
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isPipelined}
                        onChange={togglePipelineMode}
                        className="peer sr-only"
                      />
                      <div className="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                      <span className="ml-3 text-sm font-medium">Pipelined Execution</span>
                    </label>
                    <p className="ml-14 text-xs text-gray-600">
                      {isPipelined
                        ? "Tasks overlap in time - stages execute in parallel"
                        : "Tasks execute one at a time - each task completes before the next begins"}
                    </p>

                    {/* Superscalar toggle, only available in pipelined mode and when enabled by feature flag */}
                    {isPipelined && FEATURE_FLAGS.SHOW_SUPERSCALAR_TOGGLE && (
                      <>
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
                            <span className="flex items-center gap-2">
                              Superscalar Mode ({superscalarFactor}-way)
                              {isSuperscalarActive && (
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                  {superscalarFactor}x
                                </span>
                              )}
                            </span>
                          </span>
                        </label>
                        <p className="ml-14 text-xs text-gray-600">
                          {isSuperscalarActive
                            ? "Multiple tasks can start simultaneously"
                            : "Only one task can start per time period"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Visual Symbols Legend */}
              <div className="visual-elements-legend mb-4">
                <h3 className="mb-2 font-semibold">Visual Elements Legend</h3>
                <div className="space-y-3 text-sm">
                  {/* Stage Icons Section */}
                  <div>
                    <div className="mb-2 font-medium">Pipeline Stages:</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {PIPELINE_STAGES.map((stageName, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 rounded bg-gray-50 p-2"
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded border border-gray-300"
                            style={{ backgroundColor: STAGE_COLORS[index], opacity: 0.7 }}
                          >
                            <img src={STAGE_IMAGES[index]} alt={stageName} className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-medium">{stageName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruction Management UI */}
              <div className="pipeline-instructions-section mb-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium">Tasks</h3>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600"
                  >
                    {showAddForm ? "Cancel" : "Add Task"}
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
                      placeholder="Enter task name (e.g., Task E)"
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
                      <li key={instr.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded border border-gray-400 bg-gray-100"></div>
                          <span>
                            <strong>{instr.name}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveInstruction(instr.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove task"
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
        )}
        <MetricTooltip
          completedTasks={completedInstructions}
          timeInHours={currentTimeInHours}
          isVisible={metricTooltip.visible}
          x={metricTooltip.x}
          y={metricTooltip.y}
        />
      </div>
    );
  }
);
