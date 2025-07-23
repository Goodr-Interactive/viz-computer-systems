import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineThroughputComparison } from "./components";

export const PipeliningThroughputPage: React.FunctionComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-center sm:mb-6">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Pipeline Throughput: Impact of Workload Size
          </h1>
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-base text-gray-700 sm:text-lg">
              From Hennessy & Patterson's "Computer Organization and Design"
            </p>
          </div>
        </div>

        <PipelineThroughputComparison />

        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-center sm:gap-4">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="/csc368/pipelining-comparison">Basic Comparison</a>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="/csc368/pipelining">Single Visualization</a>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="/csc368">Back to CSC368</a>
          </Button>
        </div>
      </div>
    </div>
  );
};
