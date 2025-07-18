import React from "react";
import { Button } from "@/components/ui/button";

export const CSC368: React.FunctionComponent = () => {
  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center gap-[24px]">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
        CSC368 - Computer Architecture
      </h1>
      <span>Select a topic to explore below.</span>
      <div className="flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368/pipelining">Instruction Pipelining</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368/caches">Cache Hierarchy</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368/associativity">Cache Associativity</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/csc368/coherence">Coherence True vs False Sharing</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/">Back to Home</a>
        </Button>
      </div>
    </div>
  );
};
