import React from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "../../App";

export const CSC368: React.FunctionComponent = () => {
  const routes = ROUTES.filter(({ path }) => path.includes("csc368") && path.split("/").length > 2);

  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center gap-[24px]">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
        CSC368 – Computer Architecture
      </h1>
      <span>Select a topic to explore below.</span>
      <div className="flex max-w-[500px] flex-wrap justify-center gap-[16px]">
        {routes.map((route) => (
          <Button asChild variant="outline">
            <a href={route.path}>{route.title}</a>
          </Button>
        ))}
      </div>
      <Button asChild>
        <a href={"/"}>Back to Home</a>
      </Button>
    </div>
  );
};
