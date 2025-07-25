import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SimpleFalseSharingViz, BasicFalseSharingViz, LinearFalseSharingViz, ConfigurableFalseSharingViz } from "./components";

export const Coherence: React.FunctionComponent = () => {
  const [viewMode, setViewMode] = useState<"basic" | "linear" | "configurable" | "grid">("basic");

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
        {viewMode === "basic" && <BasicFalseSharingViz />}
        {viewMode === "linear" && <LinearFalseSharingViz />}
        {viewMode === "configurable" && <ConfigurableFalseSharingViz />}
        {viewMode === "grid" && <SimpleFalseSharingViz />}
      </div>

      {/* View Mode Toggle - Moved to bottom */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "basic" ? "default" : "outline"}
          onClick={() => setViewMode("basic")}
        >
          Basic View
        </Button>
        <Button
          variant={viewMode === "linear" ? "default" : "outline"}
          onClick={() => setViewMode("linear")}
        >
          Linear View
        </Button>
        <Button
          variant={viewMode === "configurable" ? "default" : "outline"}
          onClick={() => setViewMode("configurable")}
        >
          Configurable View
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          onClick={() => setViewMode("grid")}
        >
          Grid View
        </Button>
      </div>

      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
