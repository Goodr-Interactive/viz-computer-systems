import React, { useState, useEffect } from "react";
import { PipelineVisualization } from "./PipelineVisualization";
import type { Instruction } from "./types";
import { DEFAULT_INSTRUCTIONS } from "./config";

// Import reset SVG icon
import resetSvg from "@/assets/reset.svg";

interface PipelineComparisonProps {
  instructions?: Instruction[];
}

export const PipelineComparison: React.FC<PipelineComparisonProps> = ({
  instructions = DEFAULT_INSTRUCTIONS,
}) => {
  // Shared state for both visualizations
  const [sharedCycles, setSharedCycles] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Auto-advance logic when running
  useEffect(() => {
    if (!isRunning) return;

    const timer = setTimeout(() => {
      setSharedCycles(prev => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, sharedCycles]);

  // Shared control handlers
  const handleSharedStepForward = () => {
    setSharedCycles(prev => prev + 1);
    // Trigger step forward on both visualizations
    triggerStepOnBoth();
  };

  const handleSharedToggleRun = () => {
    setIsRunning(prev => !prev);
    // Trigger play/pause on both visualizations
    triggerPlayPauseOnBoth();
  };

  const handleSharedReset = () => {
    setIsRunning(false);
    setSharedCycles(-1);
    // Trigger reset on both visualizations
    triggerResetOnBoth();
  };

  // Helper functions to trigger actions on both visualizations
  const triggerStepOnBoth = () => {
    // Find all step forward buttons and click them
    const stepButtons = document.querySelectorAll('.compact-visualization button[title="Step Forward One Cycle"]');
    stepButtons.forEach(button => {
      (button as HTMLButtonElement).click();
    });
  };

  const triggerPlayPauseOnBoth = () => {
    // Find all play/pause buttons and click them
    const playButtons = document.querySelectorAll('.compact-visualization button[title*="Auto Run"], .compact-visualization button[title*="Pause Auto Run"]');
    playButtons.forEach(button => {
      (button as HTMLButtonElement).click();
    });
  };

  const triggerResetOnBoth = () => {
    // Find all reset buttons and click them
    const resetButtons = document.querySelectorAll('.compact-visualization button[title="Reset to Beginning"]');
    resetButtons.forEach(button => {
      (button as HTMLButtonElement).click();
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        {/* Shared Controls */}
        <div className="flex justify-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mr-4 self-center">Shared Controls:</h3>
          <button
            onClick={handleSharedStepForward}
            className="flex items-center justify-center rounded bg-green-500 px-6 py-3 text-white hover:bg-green-600"
            title="Step Forward One Cycle (Both Visualizations)"
          >
            <span className="text-sm font-medium">Step Forward →</span>
          </button>
          {/* <button
            onClick={handleSharedToggleRun}
            className={`flex items-center justify-center rounded px-6 py-3 text-white ${
              isRunning ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
            title={isRunning ? "Pause Auto Run (Both)" : "Run Automatically (Both)"}
          >
            <span className="text-sm font-medium">{isRunning ? "Pause Both" : "Auto Run Both"}</span>
          </button> */}
          <button
            onClick={handleSharedReset}
            className="flex items-center justify-center rounded bg-gray-500 px-6 py-3 text-white hover:bg-gray-600"
            title="Reset Both Simulations"
          >
            <img src={resetSvg} alt="Reset" className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Reset Both</span>
          </button>
        </div>
      </div>

      {/* Compact Non-Pipelined Version */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-red-800 mb-1">
            📅 Sequential Execution (Non-Pipelined)
          </h2>
          <p className="text-sm text-red-700">
            Each load completes entirely before the next begins. Only one stage is active at a time.
          </p>
          <p className="text-xs text-red-600 mt-1">
            💡 This visualization is set to NON-PIPELINED mode
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-2">
          <div className="compact-visualization">
            <PipelineVisualization
              instructions={instructions}
              width={600}
              height={250}
              pipelined={false} // Explicitly set to non-pipelined
            />
          </div>
        </div>
      </div>

      {/* Compact Pipelined Version */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-green-800 mb-1">
            ⚡ Pipelined Execution
          </h2>
          <p className="text-sm text-green-700">
            Multiple stages work simultaneously. While one load washes, another dries.
          </p>
          <p className="text-xs text-green-600 mt-1">
            💡 This visualization is set to PIPELINED mode
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-2">
          <div className="compact-visualization">
            <PipelineVisualization
              instructions={instructions}
              width={600}
              height={250}
              pipelined={true} // Explicitly set to pipelined
            />
          </div>
        </div>
      </div>
    </div>
  );
};
