import React from "react";
import { Button } from "@/components/ui/button";
import { RegisterPipelineVisualization } from "./components";

export const RegisterPipeline: React.FunctionComponent = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <h1 className="mb-2 scroll-m-20 text-3xl font-bold tracking-tight">
        Processor Pipeline with RISC-V Instructions
      </h1>

      <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
        <RegisterPipelineVisualization />
      </div>

      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368/pipelining/registers">D3.js Version</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368/pipelining">Back to Laundry Pipeline</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
