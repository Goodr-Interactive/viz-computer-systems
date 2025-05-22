import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineVisualization } from "./components";

export const Pipelining: React.FunctionComponent = () => {
  return (
    <div className="flex flex-col items-center p-8 gap-6 min-h-screen">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">
        Instruction Pipelining 
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Interactive Pipeline Visualization</h2>
        <p className="mb-6 text-gray-700">
          This interactive visualization demonstrates how instructions move through the different stages of a pipeline.
          Use the controls below to start, stop, and reset the simulation, and observe how multiple instructions
          can be processed simultaneously.
        </p>
        
        <PipelineVisualization />
      </div>
      
      <div className="flex gap-[16px] mt-4">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
