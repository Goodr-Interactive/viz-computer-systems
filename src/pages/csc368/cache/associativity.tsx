import React from "react";
import { Button } from "@/components/ui/button";
import Associativity from "./components/Associativity";

export const AssociativityPage: React.FunctionComponent = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-7xl rounded-lg bg-white p-6 shadow-md">
       <Associativity />
    </div>

      <div className="mt-4 flex gap-[16px]">
        <Button asChild variant="outline">
          <a href="/csc368">Back to CSC368</a>
        </Button>
      </div>
    </div>
  );
};
