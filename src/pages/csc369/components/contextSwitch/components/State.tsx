import React from "react";
import type { ContextSwitchController } from "../hooks";
import { CPU } from "./CPU";
import { ProcessTable } from "./ProcessTable";
import { KernelStackDisplay } from "./KernelStack";

interface Props {
  controller: ContextSwitchController;
}

export const State: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full justify-around items-center p-[24px]">
      <ProcessTable controller={controller} />
      <div className="flex flex-col gap-[48px]">
        <KernelStackDisplay
          name="Process A Kernel Stack"
          kstack={controller.kstackA}
          copyField={(field, value) => controller.copyField("Process A Kernel Stack", field, value)}
          pasteField={controller.setStackAField}
          copy={controller.copy}
          checkpoint={controller.checkpoint.kstackA}
        />
        <KernelStackDisplay
          name="Process B Kernel Stack"
          kstack={controller.kstackB}
          copyField={(field, value) => controller.copyField("Process B Kernel Stack", field, value)}
          pasteField={controller.setStackBField}
          copy={controller.copy}
          checkpoint={controller.checkpoint.kstackB}
        />
      </div>
      <CPU controller={controller} />
    </div>
  );
};
