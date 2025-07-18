import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineVisualization } from "./components";

export const Pipelining: React.FunctionComponent = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <h1 className="mb-2 scroll-m-20 text-3xl font-bold tracking-tight">
        Instruction Pipelining: The Laundry Analogy
      </h1>
      
      <div className="max-w-4xl text-center">
        <p className="text-lg text-gray-700 mb-4">
          From Hennessy & Patterson's "Computer Organization and Design"
        </p>
        <p className="text-gray-600 mb-6">
          This visualization demonstrates the classic laundry analogy that explains how pipelining works in computer processors. 
          Watch how tasks can be executed sequentially (one at a time) versus in a pipelined fashion (overlapping stages).
        </p>
      </div>

      <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
        <PipelineVisualization />
      </div>

      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
