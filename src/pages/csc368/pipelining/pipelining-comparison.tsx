import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineComparison } from "./components";

export const PipelineComparisonPage: React.FunctionComponent = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <h1 className="mb-2 scroll-m-20 text-3xl font-bold tracking-tight">
        Instruction Pipelining: Pipelining vs Non-Pipelining Comparison
      </h1>
      
      <div className="max-w-4xl text-center">
        <p className="text-lg text-gray-700 mb-4">
          From Hennessy & Patterson's "Computer Organization and Design"
        </p>
        <p className="text-gray-600 mb-6">
          This visualization compares sequential execution (non-pipelined) with pipelined execution 
          using the classic laundry analogy. See how pipelining dramatically improves throughput 
          by allowing multiple tasks to be processed simultaneously.
        </p>
      </div>

      <div className="w-full max-w-7xl">
        <PipelineComparison />
      </div>

      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368/pipelining">Single Visualization</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
