import React, { useState, useEffect, useRef } from "react";
import { PipelineVisualization, type PipelineVisualizationRef } from "./PipelineVisualization";
import type { Instruction } from "./types";
import { AVAILABLE_COLORS } from "./config";

// Import control SVG icons
import resetSvg from "@/assets/reset.svg";
import playSvg from "@/assets/play.svg";
import pauseSvg from "@/assets/pause.svg";

// Generate instructions for different workload sizes
const generateInstructions = (count: number): Instruction[] => {
  const instructions: Instruction[] = [];
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
  
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
  const [sharedCycles, setSharedCycles] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Refs to control the child components directly
  const sequentialRef = useRef<PipelineVisualizationRef>(null);
  const pipelinedRef = useRef<PipelineVisualizationRef>(null);

  // Update instructions when task count changes
  useEffect(() => {
    setInstructions(generateInstructions(taskCount));
    // Reset the simulation when task count changes
    handleSharedReset();
  }, [taskCount]);

  // Auto-advance logic when running
  useEffect(() => {
    if (!isRunning) return;

    const timer = setTimeout(() => {
      setSharedCycles(prev => prev + 1);
      // Also step both visualizations
      sequentialRef.current?.stepForward();
      pipelinedRef.current?.stepForward();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, sharedCycles]);

  // Shared control handlers
  const handleSharedStepForward = () => {
    setSharedCycles(prev => prev + 1);
    // Directly call step forward on both visualizations
    sequentialRef.current?.stepForward();
    pipelinedRef.current?.stepForward();
  };

  const handleSharedToggleRun = () => {
    setIsRunning(prev => !prev);
    // Directly call toggle run on both visualizations
    sequentialRef.current?.toggleRun();
    pipelinedRef.current?.toggleRun();
  };

  const handleSharedReset = () => {
    setIsRunning(false);
    setSharedCycles(-1);
    // Directly call reset on both visualizations
    sequentialRef.current?.reset();
    pipelinedRef.current?.reset();
  };

  // Task count options
  const taskOptions = [4, 8, 12, 16, 20];

  // Calculate visualization dimensions based on task count
  // Prioritize fitting everything on screen without horizontal scrolling
  const getVisualizationDimensions = (taskCount: number) => {
    // Calculate how many cycles we'll need for the visualization
    const pipelinedCycles = taskCount + 3; // Pipeline: startup + tasks (3 stages overlap)
    const sequentialCycles = taskCount * 4; // Sequential: 4 stages per task
    const maxCycles = Math.max(pipelinedCycles, sequentialCycles);
    
    // Base margins and spacing (from LAYOUT_CONFIG.COMPACT_MODE)
    const margins = { left: 60, right: 15, top: 20, bottom: 50 };
    const totalMargins = margins.left + margins.right;
    const totalVerticalMargins = margins.top + margins.bottom;
    
    // Available viewport constraints - prioritize no horizontal scrolling
    const maxViewportWidth = 1200; // Maximum width to avoid horizontal scrolling
    const maxViewportHeight = 500; // Maximum height to ensure it fits on screen
    const minViewportHeight = 200; // Minimum height for usability
    
    // Calculate available space for the grid (subtract margins)
    const availableGridWidth = maxViewportWidth - totalMargins;
    
    // Calculate stage width to fit all cycles horizontally without scrolling
    const maxStageWidth = Math.floor(availableGridWidth / maxCycles);
    
    // Calculate stage dimensions based on available space and task count
    let stageWidth: number;
    let stageHeight: number;
    
    // Start with calculated width that fits all cycles, with reasonable bounds
    stageWidth = Math.max(12, Math.min(40, maxStageWidth));
    
    // For height, balance between readability and fitting vertically
    if (taskCount <= 4) {
      stageHeight = Math.min(stageWidth, 40); // Keep square, max 40px
    } else if (taskCount <= 8) {
      stageHeight = Math.min(stageWidth, 32); // Keep proportional
    } else if (taskCount <= 12) {
      stageHeight = Math.min(stageWidth, 26); // Smaller for more tasks
    } else if (taskCount <= 16) {
      stageHeight = Math.min(stageWidth, 22); // Even smaller
    } else {
      stageHeight = Math.min(stageWidth, 18); // Minimal but readable
    }
    
    // Ensure minimum readable size
    stageWidth = Math.max(12, stageWidth);
    stageHeight = Math.max(12, stageHeight);
    
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
      stageHeight = Math.max(10, Math.floor(stageHeight * scaleFactor));
      stageWidth = Math.max(10, Math.floor(stageWidth * scaleFactor)); // Keep proportional
      const newGridHeight = taskCount * (stageHeight + Math.max(1, Math.floor(instructionSpacing * scaleFactor)));
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
        margins
      }
    };
  };

  const { width: vizWidth, height: vizHeight, stageWidth, stageHeight } = getVisualizationDimensions(taskCount);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Controls Header */}
      <div className="bg-gray-50 border rounded-lg p-4">
        {/* Single Row with Task Selector, Speedup Metric, and Controls */}
        <div className="flex items-center justify-between gap-6">
          {/* Task Count Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Number of Tasks:
            </label>
            <select
              value={taskCount}
              onChange={(e) => setTaskCount(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {taskOptions.map((count) => (
                <option key={count} value={count}>
                  {count} tasks
                </option>
              ))}
            </select>
          </div>

          {/* Speedup Metric */}
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-700">Pipeline Speedup:</div>
            <div className="text-xl font-bold text-blue-900">
              {(() => {
                const sequentialCycles = taskCount * 4; // 4 stages per task
                const pipelinedCycles = taskCount + 3; // Initial fill + tasks
                const speedup = sequentialCycles / pipelinedCycles;
                return speedup.toFixed(1);
              })()}×
            </div>
            <div className="text-xs text-blue-600">
              {taskCount * 4} vs {taskCount + 3} cycles
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Controls:</span>
            <button
              onClick={handleSharedStepForward}
              className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 text-sm"
              title="Step Forward One Cycle (Both Visualizations)"
            >
              <span>Step →</span>
            </button>
            <button
              onClick={handleSharedToggleRun}
              className={`flex items-center gap-2 rounded px-4 py-2 text-white text-sm ${
                isRunning ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
              }`}
              title={isRunning ? "Pause Auto Run (Both)" : "Run Automatically (Both)"}
            >
              <img 
                src={isRunning ? pauseSvg : playSvg} 
                alt={isRunning ? "Pause" : "Play"} 
                className="h-4 w-4" 
              />
              <span>{isRunning ? "Pause" : "Auto"}</span>
            </button>
            <button
              onClick={handleSharedReset}
              className="flex items-center gap-2 rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 text-sm"
              title="Reset Both Simulations"
            >
              <img src={resetSvg} alt="Reset" className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stacked Visualizations */}
      <div className="space-y-3 flex flex-col items-center">
        {/* Sequential (Non-Pipelined) */}
        <div className="bg-white border rounded w-full">
          <div className="p-3 text-center border-b bg-red-50">
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
            />
          </div>
        </div>

        {/* Pipelined */}
        <div className="bg-white border rounded w-full">
          <div className="p-3 text-center border-b bg-green-50">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};
