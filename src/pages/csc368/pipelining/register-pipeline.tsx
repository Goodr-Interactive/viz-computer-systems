import React from "react";
import { Button } from "@/components/ui/button";
import { RegisterPipelineVisualization } from "./components";

export const RegisterPipeline: React.FunctionComponent = () => {
  return (
    <div className="flex flex-col items-center p-8 gap-6 min-h-screen">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">
        Processor Pipeline with RISC-V Instructions
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
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
