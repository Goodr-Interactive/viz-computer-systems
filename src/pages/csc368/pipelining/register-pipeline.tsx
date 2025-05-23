import React from "react";
import { Button } from "@/components/ui/button";
import { RegisterPipelineVisualization } from "./components";

export const RegisterPipeline: React.FunctionComponent = () => {
  return (
    <div className="flex flex-col items-center p-8 gap-6 min-h-screen">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">
        CPU Pipeline with Registers
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Instruction Pipeline with Registers Visualization</h2>
        <p className="mb-6 text-gray-700">
          This interactive visualization demonstrates how a CPU pipeline works with pipeline registers between stages.
          Pipeline registers hold data between pipeline stages and are a critical component of real CPU design.
          They act as "latches" that separate each stage, holding instruction data and control signals as they flow through the pipeline.
          This is a more technical representation that shows how the laundry analogy maps to actual CPU design.
        </p>
        
        <RegisterPipelineVisualization />
      </div>
      
      <div className="flex gap-[16px] mt-4">
        <Button asChild variant="outline">
          <a href="/csc368/pipelining">Back to Laundry Pipeline</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
        <Button asChild variant="secondary" disabled>
          <a href="#">Next Visualization (Coming Soon)</a>
        </Button>
      </div>
    </div>
  );
};
