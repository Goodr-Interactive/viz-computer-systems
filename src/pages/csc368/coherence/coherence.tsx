import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SimpleFalseSharingViz, LinearFalseSharingViz } from "./components";

export const Coherence: React.FunctionComponent = () => {
  const [viewMode, setViewMode] = useState<"grid" | "linear">("grid");

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          onClick={() => setViewMode("grid")}
        >
          Grid View
        </Button>
        <Button
          variant={viewMode === "linear" ? "default" : "outline"}
          onClick={() => setViewMode("linear")}
        >
          Linear View
        </Button>
      </div>

      <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
        {viewMode === "grid" ? <SimpleFalseSharingViz /> : <LinearFalseSharingViz />}
      </div>
      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
