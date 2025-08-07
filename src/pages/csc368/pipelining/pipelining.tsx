import React from "react";
import { Button } from "@/components/ui/button";
import { LightModeEnforcer } from "@/components/LightModeEnforcer";
import { PipelineVisualization } from "./components";

export const Pipelining: React.FunctionComponent = () => {
  return (
    <LightModeEnforcer>
      <div className="flex min-h-screen flex-col items-center gap-6 p-8">
        <h1 className="mb-2 scroll-m-20 text-3xl font-bold tracking-tight">
          Instruction Pipelining Basics: The Laundry Analogy
        </h1>

        <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
          <PipelineVisualization />
        </div>

        <div className="mt-4 flex gap-[16px]">
          <Button asChild variant="outline">
            <a href="/csc368/pipelining-comparison">Basic Comparison</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/csc368/pipelining-throughput">Throughput Analysis</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/csc368">Back to CSC368</a>
          </Button>
        </div>
      </div>
    </LightModeEnforcer>
  );
};
