import React from "react";
import { Button } from "@/components/ui/button";
import { BasicLaundry } from "./components";

export const Pipelining: React.FunctionComponent = () => {
  return (
    <div className="flex flex-col items-center p-8 gap-6 min-h-screen">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-2">
        Instruction Pipelining Basics: The Laundry Analogy
      </h1>
      
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <BasicLaundry />
      </div>
      
      <div className="flex gap-[16px] mt-4">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
