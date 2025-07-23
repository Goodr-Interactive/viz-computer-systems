import React, { useState, useEffect, useRef } from "react";
import { PipelineVisualization, type PipelineVisualizationRef } from "./PipelineVisualization";
import type { Instruction } from "./types";
import { DEFAULT_INSTRUCTIONS } from "./config";

// Import control SVG icons
import resetSvg from "@/assets/reset.svg";
import playSvg from "@/assets/play.svg";
import pauseSvg from "@/assets/pause.svg";

interface PipelineComparisonProps {
  instructions?: Instruction[];
}

export const PipelineComparison: React.FC<PipelineComparisonProps> = ({
  instructions = DEFAULT_INSTRUCTIONS,
}) => {
  // Shared state for both visualizations
  const [sharedCycles, setSharedCycles] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Refs to control the child components directly
  const sequentialRef = useRef<PipelineVisualizationRef>(null);
  const pipelinedRef = useRef<PipelineVisualizationRef>(null);

  // Auto-advance logic when running
  useEffect(() => {
    if (!isRunning) return;

    const timer = setTimeout(() => {
      setSharedCycles((prev) => prev + 1);
      // Also step both visualizations
      sequentialRef.current?.stepForward();
      pipelinedRef.current?.stepForward();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, sharedCycles]);

  // Shared control handlers
  const handleSharedStepForward = () => {
    setSharedCycles((prev) => prev + 1);
    // Directly call step forward on both visualizations
    sequentialRef.current?.stepForward();
    pipelinedRef.current?.stepForward();
  };

  const handleSharedToggleRun = () => {
    setIsRunning((prev) => !prev);
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Header with shared controls */}
      <div className="rounded-lg border bg-gray-50 p-3">
        <div className="mb- flex items-center justify-center">
          {/* Shared Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Controls:</span>
            <button
              onClick={handleSharedStepForward}
              className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              title="Step Forward One Cycle (Both Visualizations)"
            >
              <span>Step →</span>
            </button>
            <button
              onClick={handleSharedToggleRun}
              className={`flex items-center gap-2 rounded px-4 py-2 text-sm text-white ${
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
              className="flex items-center gap-2 rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600"
              title="Reset Both Simulations"
            >
              <img src={resetSvg} alt="Reset" className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Combined Visualization Container - Stacked Layout */}
      <div className="flex flex-col items-center space-y-3">
        {/* Sequential (Non-Pipelined) Version */}
        <div className="w-full max-w-3xl rounded border bg-white">
          <div className="combined-viz">
            <PipelineVisualization
              ref={sequentialRef}
              instructions={instructions}
              width={800}
              height={250}
              pipelined={false}
              compact={true}
              externalControl={true}
            />
          </div>
        </div>

        {/* Pipelined Version */}
        <div className="w-full max-w-3xl rounded border bg-white">
          <div className="combined-viz">
            <PipelineVisualization
              ref={pipelinedRef}
              instructions={instructions}
              width={800}
              height={250}
              pipelined={true}
              compact={true}
              externalControl={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
