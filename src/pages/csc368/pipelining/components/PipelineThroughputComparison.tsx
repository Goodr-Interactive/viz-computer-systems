import React, { useState, useEffect, useRef } from "react";
import { PipelineVisualization, type PipelineVisualizationRef } from "./PipelineVisualization";
import type { Instruction } from "./types";
import { AVAILABLE_COLORS, TIMING_CONFIG } from "./config";

// Import control SVG icons
import resetSvg from "@/assets/reset.svg";
import playSvg from "@/assets/play.svg";
import pauseSvg from "@/assets/pause.svg";

// Generate instructions for different workload sizes
const generateInstructions = (count: number): Instruction[] => {
  const instructions: Instruction[] = [];
  const labels = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
  ];

  for (let i = 0; i < count; i++) {
    const label = labels[i] || `Task${i + 1}`;
    instructions.push({
      id: i + 1,
      name: `Task ${label}`,
      color: AVAILABLE_COLORS[i % AVAILABLE_COLORS.length],
      registers: { src: [], dest: [] },
    });
  }

  return instructions;
};

export const PipelineThroughputComparison: React.FC = () => {
  // Task count state
  const [taskCount, setTaskCount] = useState<number>(4);
  const [instructions, setInstructions] = useState<Instruction[]>(generateInstructions(taskCount));

  // Shared state for both visualizations
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(TIMING_CONFIG.DEFAULT_SPEED_MS);

  // State for responsive dimensions
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1200, height: 800 };
  });

  // Refs to control the child components directly
  const sequentialRef = useRef<PipelineVisualizationRef>(null);
  const pipelinedRef = useRef<PipelineVisualizationRef>(null);

  // Handle window resize for responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update instructions when task count changes
  useEffect(() => {
    setInstructions(generateInstructions(taskCount));
    // Reset the simulation when task count changes
    handleSharedReset();
  }, [taskCount]);

  // Auto-advance logic when running
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      // Only step the visualizations - they manage their own cycles
      sequentialRef.current?.stepForward();
      pipelinedRef.current?.stepForward();
    }, simulationSpeed);

    return () => clearInterval(timer);
  }, [isRunning, simulationSpeed]);

  // Shared control handlers
  const handleSharedStepForward = () => {
    // Only call step forward on both visualizations
    sequentialRef.current?.stepForward();
    pipelinedRef.current?.stepForward();
  };

  const handleSharedToggleRun = () => {
    setIsRunning((prev) => !prev);
    // Don't call toggleRun on the refs - manage our own running state
  };

  const handleSharedReset = () => {
    setIsRunning(false);
    // Only call reset on both visualizations
    sequentialRef.current?.reset();
    pipelinedRef.current?.reset();
  };

  // Task count options
  const taskOptions = [4, 8, 12, 16, 20];

  // Calculate visualization dimensions based on task count
  // Prioritize fitting everything on screen without horizontal scrolling
  const getVisualizationDimensions = (
    taskCount: number,
    windowSize?: { width: number; height: number }
  ) => {
    // Calculate how many cycles we'll need for the visualization
    const pipelinedCycles = taskCount + 3; // Pipeline: startup + tasks (3 stages overlap)
    const sequentialCycles = taskCount * 4; // Sequential: 4 stages per task
    const maxCycles = Math.max(pipelinedCycles, sequentialCycles);

    // Base margins and spacing (from LAYOUT_CONFIG.COMPACT_MODE)
    const margins = { left: 60, right: 15, top: 20, bottom: 50 };
    const totalMargins = margins.left + margins.right;
    const totalVerticalMargins = margins.top + margins.bottom;

    // Available viewport constraints - prioritize no horizontal scrolling
    // Use responsive breakpoints for different screen sizes
    const getViewportConstraints = () => {
      const screenWidth =
        windowSize?.width || (typeof window !== "undefined" ? window.innerWidth : 1200);

      if (screenWidth < 480) {
        // Mobile
        return {
          maxWidth: screenWidth - 32, // Account for page padding
          maxHeight: 350,
          minHeight: 180,
        };
      } else if (screenWidth < 768) {
        // Tablet
        return {
          maxWidth: screenWidth - 48,
          maxHeight: 400,
          minHeight: 200,
        };
      } else if (screenWidth < 1024) {
        // Small desktop
        return {
          maxWidth: screenWidth - 64,
          maxHeight: 450,
          minHeight: 220,
        };
      } else {
        // Large screens
        return {
          maxWidth: 1200,
          maxHeight: 500,
          minHeight: 200,
        };
      }
    };

    const {
      maxWidth: maxViewportWidth,
      maxHeight: maxViewportHeight,
      minHeight: minViewportHeight,
    } = getViewportConstraints();

    // Calculate available space for the grid (subtract margins)
    const availableGridWidth = maxViewportWidth - totalMargins;

    // Calculate stage width to fit all cycles horizontally without scrolling
    const maxStageWidth = Math.floor(availableGridWidth / maxCycles);

    // Calculate stage dimensions based on available space and task count
    let stageWidth: number;
    let stageHeight: number;

    // Start with calculated width that fits all cycles, with reasonable bounds
    // Use different minimum sizes for different screen sizes
    const screenWidth =
      windowSize?.width || (typeof window !== "undefined" ? window.innerWidth : 1200);
    const minStageSize = screenWidth < 480 ? 8 : 12;
    const maxStageSize = screenWidth < 480 ? 28 : 40;

    stageWidth = Math.max(minStageSize, Math.min(maxStageSize, maxStageWidth));

    // For height, balance between readability and fitting vertically
    // Use more aggressive scaling on mobile
    if (taskCount <= 4) {
      stageHeight = Math.min(stageWidth, maxStageSize); // Keep square, max size
    } else if (taskCount <= 8) {
      stageHeight = Math.min(stageWidth, Math.floor(maxStageSize * 0.8)); // Keep proportional
    } else if (taskCount <= 12) {
      stageHeight = Math.min(stageWidth, Math.floor(maxStageSize * 0.65)); // Smaller for more tasks
    } else if (taskCount <= 16) {
      stageHeight = Math.min(stageWidth, Math.floor(maxStageSize * 0.55)); // Even smaller
    } else {
      stageHeight = Math.min(stageWidth, Math.floor(maxStageSize * 0.45)); // Minimal but readable
    }

    // Ensure minimum readable size
    stageWidth = Math.max(minStageSize, stageWidth);
    stageHeight = Math.max(minStageSize, stageHeight);

    // Calculate actual grid dimensions
    const gridWidth = maxCycles * stageWidth;
    const totalWidth = gridWidth + totalMargins;

    // Calculate height based on number of tasks with proportional spacing
    const instructionSpacing = Math.max(1, Math.floor(stageHeight * 0.05)); // Proportional spacing
    const gridHeight = taskCount * (stageHeight + instructionSpacing) - instructionSpacing; // Remove last spacing
    const calculatedHeight = gridHeight + totalVerticalMargins;

    // Scale height to fit within viewport constraints if needed
    let height = calculatedHeight;
    if (height > maxViewportHeight) {
      // If calculated height is too large, scale everything down proportionally
      const scaleFactor = (maxViewportHeight - totalVerticalMargins) / gridHeight;
      stageHeight = Math.max(minStageSize, Math.floor(stageHeight * scaleFactor));
      stageWidth = Math.max(minStageSize, Math.floor(stageWidth * scaleFactor)); // Keep proportional
      const newGridHeight =
        taskCount * (stageHeight + Math.max(1, Math.floor(instructionSpacing * scaleFactor)));
      height = newGridHeight + totalVerticalMargins;
    }

    // Ensure minimum height
    height = Math.max(minViewportHeight, height);

    return {
      width: Math.round(totalWidth),
      height: Math.round(height),
      stageWidth: Math.round(stageWidth),
      stageHeight: Math.round(stageHeight),
      maxCycles,
      gridDimensions: {
        width: Math.round(gridWidth),
        height: Math.round(height - totalVerticalMargins),
        margins,
      },
    };
  };

  const {
    width: vizWidth,
    height: vizHeight,
    stageWidth,
    stageHeight,
  } = getVisualizationDimensions(taskCount, windowSize);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-2 sm:px-4">
      {/* Controls Header */}
      <div className="rounded-lg border bg-gray-50 p-4">
        {/* Responsive Mobile-First Layout */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Top Row: Task Count and Speedup Metric */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-1">
            {/* Task Count Selector */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-gray-700">Number of Tasks:</label>
              <select
                value={taskCount}
                onChange={(e) => setTaskCount(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:w-auto"
              >
                {taskOptions.map((count) => (
                  <option key={count} value={count}>
                    {count} tasks
                  </option>
                ))}
              </select>
            </div>

            {/* Speedup Metric */}
            <div className="flex flex-col items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:gap-3">
              <div className="text-sm font-medium text-blue-700">Pipeline Speedup:</div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-blue-900">
                  {(() => {
                    const sequentialCycles = taskCount * 4; // 4 stages per task
                    const pipelinedCycles = taskCount + 3; // Initial fill + tasks
                    const speedup = sequentialCycles / pipelinedCycles;
                    return speedup.toFixed(1);
                  })()}
                  ×
                </div>
                <div className="text-xs text-blue-600">
                  {taskCount * 4} vs {taskCount + 3} cycles
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Controls and Speed */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-shrink-0">
            {/* Control Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-700 sm:hidden">Controls:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleSharedStepForward}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 sm:flex-initial"
                  title="Step Forward One Cycle (Both Visualizations)"
                >
                  <span>Forward →</span>
                </button>
                <button
                  onClick={handleSharedReset}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600 sm:flex-initial"
                  title="Reset Both Simulations"
                >
                  <img src={resetSvg} alt="Reset" className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={handleSharedToggleRun}
                  className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-sm text-white sm:flex-initial ${
                    isRunning
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                  title={isRunning ? "Pause Auto Run (Both)" : "Play Automatically (Both)"}
                >
                  <img
                    src={isRunning ? pauseSvg : playSvg}
                    alt={isRunning ? "Pause" : "Play"}
                    className="h-4 w-4"
                  />
                  <span className="hidden sm:inline">{isRunning ? "Pause" : "Play"}</span>
                </button>
              </div>
            </div>

            {/* Speed Control */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-700">Speed:</span>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 focus:outline-none sm:w-auto"
              >
                {TIMING_CONFIG.SPEED_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Visualizations */}
      <div className="flex flex-col items-center space-y-3">
        {/* Sequential (Non-Pipelined) */}
        <div className="w-full rounded border bg-white">
          <div className="border-b bg-red-50 p-3 text-center">
            <h3 className="text-lg font-semibold text-red-800">Sequential Execution</h3>
            <p className="text-sm text-red-600">One task completes before the next begins</p>
          </div>
          <div className="combined-viz">
            <PipelineVisualization
              ref={sequentialRef}
              instructions={instructions}
              width={vizWidth}
              height={vizHeight}
              pipelined={false}
              compact={true}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
              externalControl={true}
            />
          </div>
        </div>

        {/* Pipelined */}
        <div className="w-full rounded border bg-white">
          <div className="border-b bg-green-50 p-3 text-center">
            <h3 className="text-lg font-semibold text-green-800">Pipelined Execution</h3>
            <p className="text-sm text-green-600">Tasks overlap - stages execute in parallel</p>
          </div>
          <div className="combined-viz">
            <PipelineVisualization
              ref={pipelinedRef}
              instructions={instructions}
              width={vizWidth}
              height={vizHeight}
              pipelined={true}
              compact={true}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
              externalControl={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
