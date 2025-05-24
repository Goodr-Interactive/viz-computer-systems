import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Import SVG assets for pipeline stages
import shirtSvg from "@/assets/shirt.svg";
import washingMachineSvg from "@/assets/washing-machine.svg";
import tumbleDrySvg from "@/assets/tumble-dry.svg";
import handDrySvg from "@/assets/hand-dry.svg";
import closetSvg from "@/assets/closet.svg";

// Define the instruction stages
const PIPELINE_STAGES = ["Sort", "Wash", "Dry", "Fold", "Put Away"];

// Define SVG images for each pipeline stage
const STAGE_IMAGES = [
  shirtSvg, // Sort stage
  washingMachineSvg, // Wash stage
  tumbleDrySvg, // Dry stage
  handDrySvg, // Fold stage
  closetSvg, // Put Away stage
];

// Define some sample instructions for visualization
const DEFAULT_INSTRUCTIONS = [
  { id: 1, name: "Load 1 (shirts)", color: "#4285F4" },
  { id: 2, name: "Load 2 (pants)", color: "#EA4335" },
  { id: 3, name: "Load 3 (socks)", color: "#FBBC05" },
  { id: 4, name: "Load 4 (sheets)", color: "#34A853" },
  { id: 5, name: "Load 5 (jackets)", color: "#8F44AD" },
];

interface Instruction {
  id: number;
  name: string;
  color: string;
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
}

interface PipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
  isSuperscalar?: boolean; // Add superscalar property
  superscalarWidth?: number; // How many instructions can be processed in parallel
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  width,
  height,
  instructions = DEFAULT_INSTRUCTIONS,
  isSuperscalar = false,
  superscalarWidth = 2, // Default to 2-way superscalar
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(width || 800);
  const [svgHeight, setSvgHeight] = useState<number>(height || 800);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true); // Toggle between pipelined and non-pipelined
  const [isSuperscalarActive, setIsSuperscalarActive] = useState<boolean>(isSuperscalar); // Use superscalar mode
  const [superscalarFactor] = useState<number>(superscalarWidth); // How many instructions in parallel

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
      setSvgHeight(Math.max(height, 800));
    }
  }, []);

  // Add dimension monitoring
  useEffect(() => {
    // Create a ResizeObserver to watch the container size
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
          if (isSuperscalarActive) {
            // For superscalar: Start two instructions per cycle
            return {
              ...instr,
              currentStage: -1, // Not yet in pipeline
              startCycle: Math.floor(index / superscalarFactor), // Start multiple instructions per cycle
              stalled: false,
            };
          } else {
            // Standard pipeline: One instruction per cycle
            return {
              ...instr,
              currentStage: -1, // Not yet in pipeline
              startCycle: index, // Start one cycle after the previous instruction
              stalled: false,
            };
          }
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
  }, [instructions, isPipelined, isSuperscalarActive, superscalarFactor]);

  // Core visualization logic
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 50, left: 100 };

    // const parentElement = document.getElementById(vis.parentContainer);

    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    // Create the main group element
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Define defs for SVG patterns
    const defs = svg.append("defs");

    // Create patterns for each pipeline stage with the SVG icons
    STAGE_IMAGES.forEach((image, index) => {
      defs
        .append("pattern")
        .attr("id", `stage-pattern-${index}`)
        .attr("patternUnits", "objectBoundingBox")
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("href", image)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid meet");
    });

    // X and Y scales
    // Convert clock cycles to actual times (starting at 9:00 AM)
    const timeLabels = d3.range(0, cycles + 5).map((cycle) => {
      const minutes = cycle * 30; // Each cycle is 30 minutes
      const hours = Math.floor(9 + minutes / 60); // Start at 9 AM
      const mins = minutes % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours > 12 ? hours - 12 : hours;
      return `${hour12}:${mins === 0 ? "00" : mins} ${ampm}`;
    });

    const xScale = d3
      .scaleBand()
      .domain(d3.range(0, cycles + 5).map(String))
      .range([0, innerWidth])
      .padding(0.02); // make spacing almost indistinguishable

    const yScale = d3
      .scaleBand()
      .domain(pipelineInstructions.map((instr) => instr.id.toString()))
      .range([0, innerHeight])
      .padding(0.1);

    // Add X axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => timeLabels[i]));

    // Adjust tick position to align with the left edge of each band
    xAxis.selectAll(".tick")
      .attr("transform", function() {
        const tickValue = d3.select(this).datum();
        return `translate(${xScale(String(tickValue))},0)`;
      });

    // Rotate the tick labels
    xAxis
      .selectAll("text")
      .attr("transform", "rotate(60)")
      .attr("text-anchor", "start")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em");

    // Add Y axis
    g.append("g")
      .call(
        d3.axisLeft(yScale).tickFormat((d) => {
          const instr = pipelineInstructions.find((i) => i.id.toString() === d);
          return instr ? instr.name : d;
        })
      )
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -80)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Laundry Load");

    // Draw grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(0, cycles + 5))
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(String(d))!)
      .attr("x2", (d) => xScale(String(d))!)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(pipelineInstructions.map((instr) => instr.id.toString()))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d)! + yScale.bandwidth())
      .attr("y2", (d) => yScale(d)! + yScale.bandwidth())
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Draw pipeline stages for each instruction
    pipelineInstructions.forEach((instr) => {
      if (
        instr.startCycle === undefined ||
        instr.currentStage === undefined ||
        instr.currentStage < 0
      ) {
        return;
      }

      // For each cycle this instruction has been in the pipeline
      for (
        let stage = 0;
        stage <= Math.min(instr.currentStage, PIPELINE_STAGES.length - 1);
        stage++
      ) {
        const cycle = instr.startCycle + stage;
        if (cycle > cycles) continue;

        const stageName = PIPELINE_STAGES[stage];

        // Create a group for the stage
        const stageGroup = g
          .append("g")
          .attr(
            "transform",
            `translate(${xScale(String(cycle))!}, ${yScale(instr.id.toString())!})`
          )
          .attr("opacity", 0.7)
          .on("mouseover", function (event) {
            d3.select(this).attr("opacity", 1);

            const tooltip = svg
              .append("g")
              .attr("class", "tooltip")
              .attr("transform", `translate(${event.offsetX + 10},${event.offsetY - 10})`);

            tooltip
              .append("rect")
              .attr("fill", "white")
              .attr("stroke", "black")
              .attr("rx", 5)
              .attr("ry", 5)
              .attr("width", 220)
              .attr("height", 60)
              .attr("opacity", 0.9);

            tooltip.append("text").attr("x", 10).attr("y", 20).text(`Laundry: ${instr.name}`);

            tooltip
              .append("text")
              .attr("x", 10)
              .attr("y", 40)
              .text(`Stage: ${stageName} (${timeLabels[cycle]})`);
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", 0.7);
            svg.selectAll(".tooltip").remove();
          });

        // Add colored background rectangle
        stageGroup
          .append("rect")
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", instr.stalled && stage === instr.currentStage ? "#f8d7da" : instr.color)
          .attr("stroke", "black")
          .attr("rx", 4);

        // Calculate inner rectangle size for the icon (slightly smaller)
        const innerWidth = xScale.bandwidth() * 0.8;
        const innerHeight = yScale.bandwidth() * 0.8;
        const innerX = (xScale.bandwidth() - innerWidth) / 2;
        const innerY = (yScale.bandwidth() - innerHeight) / 2;

        // Add SVG icon on top
        stageGroup
          .append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("x", innerX)
          .attr("y", innerY)
          .attr("fill", `url(#stage-pattern-${stage})`)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .attr("rx", 4);

        // Add a light overlay to tint the icon with instruction color
        stageGroup
          .append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("x", innerX)
          .attr("y", innerY)
          .attr("fill", instr.color)
          .attr("opacity", 0.2)
          .attr("rx", 4);

        // Add superscalar indicator for instructions that start in the same cycle
        // Only add this to the first stage (stage 0) when in superscalar mode
        if (isSuperscalarActive && stage === 0) {
          // Check if there are multiple instructions starting in this cycle
          const parallelInstructions = pipelineInstructions.filter(
            (i) => i.startCycle === instr.startCycle
          );

          if (parallelInstructions.length > 1) {
            // Only add the badge to the first instruction in this cycle
            if (instr.id === parallelInstructions[0].id) {
              // Add a superscalar badge to indicate parallel execution
              const badgeGroup = stageGroup
                .append("g")
                .attr("transform", `translate(${xScale.bandwidth() - 20}, 5)`);

              badgeGroup
                .append("circle")
                .attr("r", 10)
                .attr("fill", "#9333ea") // Purple for superscalar
                .attr("stroke", "white")
                .attr("stroke-width", 1);

              badgeGroup
                .append("text")
                .attr("x", 0)
                .attr("y", 3)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "white")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(`${parallelInstructions.length}x`);
            }
          }
        }
      }
    });
  }, [svgWidth, svgHeight, cycles, pipelineInstructions]);

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
    setPipelineInstructions(
      instructions.map((instr, index) => {
        if (isPipelined) {
          if (isSuperscalarActive) {
            return {
              ...instr,
              currentStage: -1,
              startCycle: Math.floor(index / superscalarFactor),
              stalled: false,
            };
          } else {
            return {
              ...instr,
              currentStage: -1,
              startCycle: index,
              stalled: false,
            };
          }
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
      color: availableColors[pipelineInstructions.length % availableColors.length],
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
      };
    });

    setPipelineInstructions(reindexedInstructions);
    setCycles(0);
  };

  // Calculate total cycles to complete all instructions
  const totalCyclesRequired = isPipelined
    ? isSuperscalarActive
      ? Math.ceil(pipelineInstructions.length / superscalarFactor) + PIPELINE_STAGES.length - 1
      : pipelineInstructions.length + PIPELINE_STAGES.length - 1
    : pipelineInstructions.length * PIPELINE_STAGES.length;

  // Calculate CPI (Cycles Per Instruction) and IPC (Instructions Per Cycle)
  const cpi =
    pipelineInstructions.length > 0 && cycles > 0
      ? (cycles / Math.min(cycles, pipelineInstructions.length)).toFixed(2)
      : "0.00";

  const ipc =
    cycles > 0 ? (Math.min(cycles, pipelineInstructions.length) / cycles).toFixed(2) : "0.00";

  // Calculate theoretical maximum metrics
  const theoreticalMaxCPI = isPipelined
    ? isSuperscalarActive
      ? (1 / superscalarFactor).toFixed(2)
      : "1.00"
    : PIPELINE_STAGES.length.toFixed(2);

  const theoreticalMaxIPC = isPipelined
    ? isSuperscalarActive
      ? superscalarFactor.toString()
      : "1.00"
    : (1 / PIPELINE_STAGES.length).toFixed(2);

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
                Current Time:{" "}
                {cycles > 0
                  ? (() => {
                      const minutes = Math.floor(cycles / 2) * 30;
                      const hours = Math.floor(9 + minutes / 60);
                      const mins = minutes % 60;
                      const ampm = hours >= 12 ? "PM" : "AM";
                      const hour12 = hours > 12 ? hours - 12 : hours;
                      return `${hour12}:${mins === 0 ? "00" : mins} ${ampm}`;
                    })()
                  : "9:00 AM"}
                <span className="text-xs text-gray-500"> (Cycle: {cycles})</span>
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
          <svg ref={svgRef} width={svgWidth} height={svgHeight}></svg>
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
                  <strong>All done!</strong> All laundry loads have been completed. Final time:{" "}
                  {(() => {
                    const minutes = Math.floor(cycles / 2) * 30;
                    const hours = Math.floor(9 + minutes / 60);
                    const mins = minutes % 60;
                    const ampm = hours >= 12 ? "PM" : "AM";
                    const hour12 = hours > 12 ? hours - 12 : hours;
                    return `${hour12}:${mins === 0 ? "00" : mins} ${ampm}`;
                  })()}
                  . It took {cycles} "cycles" to complete all {pipelineInstructions.length} loads of
                  laundry.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls and Instructions Container - Right side on desktop */}
      <div className="flex w-full flex-col lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Pipeline Controls</h2>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
            >
              Start
            </button>
            <button
              onClick={handlePause}
              disabled={!isRunning}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
            >
              Pause
            </button>
            <button
              onClick={handleReset}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              {pipelineInstructions.every(
                (instr) =>
                  instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
              )
                ? "Start Over"
                : "Reset"}
            </button>
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
