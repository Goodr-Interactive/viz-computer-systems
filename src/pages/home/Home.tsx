import React from "react";
import { Button } from "@/components/ui/button";

export const Home: React.FunctionComponent = () => {
  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center gap-[24px]">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Welcome to Viz-Computer-Systems by Goodr Interactive</h1>
      <span>Select your course below.</span>
      <div className="flex gap-[16px]">
      <Button asChild variant="outline">
        <a href="/csc368">CSC368</a>
      </Button>
      <Button asChild variant="outline">
        <a href="/csc369">CSC369</a>
      </Button>
      </div>
    </div>
  );
};
