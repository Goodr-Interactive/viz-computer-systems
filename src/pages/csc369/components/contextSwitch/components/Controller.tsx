import React from "react";
import type { ContextSwitchController } from "../hooks";
import { Button } from "@/components/ui/button";

interface Props {
  controller: ContextSwitchController;
}

export const Controller: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full items-center justify-between p-[24px]">
      {controller.hint ? (
        <p className="text-muted-foreground text-sm">{controller.hint}</p>
      ) : (
        <Button variant={"outline"} onClick={controller.showHint}>
          Hint?
        </Button>
      )}
      {controller.complete ? (
        <Button variant={"outline"} onClick={controller.restart}>
          Restart
        </Button>
      ) : (
        <div className="flex gap-[12px]">
          <Button onClick={controller.nextStep}>Submit</Button>
          <Button onClick={controller.reset} variant={"secondary"}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};
