import React from "react";
import { Button } from "@/components/ui/button";
import { PipelineComparison } from "./components";
import { BASE } from "@/constants";

export const PipeliningComparisonPage: React.FunctionComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
            Pipelining vs Sequential: Comparison
          </h1>
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-lg text-gray-700">
              From Hennessy & Patterson's "Computer Organization and Design"
            </p>
          </div>
        </div>

        <PipelineComparison />

        <div className="mt-6 flex justify-center gap-4">
          <Button asChild variant="outline">
            <a href={`${BASE}/csc368/pipelining-throughput`}>Throughput Analysis</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`${BASE}/csc368/pipelining`}>Single Visualization</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`${BASE}/csc368`}>Back to CSC368</a>
          </Button>
        </div>
      </div>
    </div>
  );
};
