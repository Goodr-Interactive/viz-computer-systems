import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineVisualization } from "./components";

export const AdvancedLaundryPipelining: React.FunctionComponent = () => {
  return (
    <div className="flex flex-col items-center p-8 gap-6 min-h-screen">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">
        Instruction Pipelining: The Laundry Analogy
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Interactive Laundry Pipeline Visualization</h2>
        <p className="mb-6 text-gray-700">
          This interactive visualization demonstrates how pipelining works using a laundry analogy. 
          Just like modern CPUs process multiple instructions at once, you can process multiple loads 
          of laundry simultaneously by pipelining the work. Use the controls below to start, stop, 
          and reset the simulation.
        </p>
        
        <PipelineVisualization />
      </div>
      
      <div className="flex gap-[16px] mt-4">
        <Button asChild variant="outline">
          <a href="/csc368/pipelining">Back to Basics of Pipelines</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
        <Button asChild variant="outline" disabled>
          <a href="#">Next Visualization CPU Register with Pipelines</a>
        </Button>
      </div>
    </div>
  );
};
