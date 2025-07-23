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
  // More tasks = smaller individual icons to fit horizontally
  const getVisualizationDimensions = (taskCount: number) => {
    // Base dimensions for 4 tasks
    const baseWidth = 800;
    const baseHeight = 250;
    
    // Calculate appropriate stage size based on task count
    // We want to fit all tasks in a reasonable width while keeping stages visible
    const maxCycles = taskCount + 3; // Approximate max cycles needed (startup + tasks)
    const availableWidth = baseWidth - 200; // Leave space for margins and labels
    
    // Calculate stage width to fit all cycles within available width
    let stageWidth = Math.max(20, Math.min(40, availableWidth / maxCycles)); // Min 20px, Max 40px
    
    // For many tasks, make stages even smaller but readable
    if (taskCount >= 16) {
      stageWidth = Math.max(15, availableWidth / maxCycles);
    }
    
    // Stage height should maintain reasonable proportions but scale with width
    const stageHeight = Math.max(15, Math.min(stageWidth, 40));
    
    // Adjust total width based on calculated stage size
    const width = Math.max(baseWidth, maxCycles * stageWidth + 200);
    
    return { 
      width, 
      height: baseHeight, 
      stageWidth: Math.round(stageWidth),
      stageHeight: Math.round(stageHeight)
    };
  };

  const { width: vizWidth, height: vizHeight, stageWidth, stageHeight } = getVisualizationDimensions(taskCount);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Controls Header */}
      <div className="bg-gray-50 border rounded-lg p-4">
        {/* Task Count Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Tasks: {taskCount} (Stage Size: {stageWidth}×{stageHeight}px)
          </label>
          <div className="flex gap-2 mb-3">
            {taskOptions.map((count) => (
              <button
                key={count}
                onClick={() => setTaskCount(count)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  taskCount === count
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {count} tasks
              </button>
            ))}
          </div>
        </div>

        {/* Shared Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Controls:</span>
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
          <div className="combined-viz overflow-x-auto">
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
        </div>
    </div>
  );
};
