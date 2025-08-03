import React from "react";
import type { ContextSwitchController } from "../hooks";
import { CPU } from "./CPU";
import { ProcessTable } from "./ProcessTable";
import { KernelStackDisplay } from "./KernelStack";
import { ContextTable } from "./ContextTable";
import { Step } from "../types";

interface Props {
  controller: ContextSwitchController;
}

export const State: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full justify-around items-center p-[12px] flex-wrap gap-[12px]">
      <ProcessTable 
        name="Process A"
        process={controller.processA}
        checkpoint={controller.checkpoint.processA}
        errors={controller.errors["processA"]}
        setState={controller.setProcessAState}
      />
      <div className="flex flex-col gap-[12px]">
      <KernelStackDisplay
          name="Process A Kernel Stack"
          section="kStackA"
          kstack={controller.kstackA}
          copyField={(field, value) => controller.copyField("kStackA", field, value, [Step.TRAP_RET, Step.I_RET].includes(controller.step))}
          pasteField={controller.setStackAField}
          copy={controller.copy}
          checkpoint={controller.checkpoint.kstackA}
          errors={controller.errors["kStackA"]}
        />
        <ContextTable 
          name="Process A Context"
          section="contextA"
          checkpoint={controller.checkpoint.processA.context}
          context={controller.processA.context}
          controller={controller}
          updateField={controller.setProcessAContextField}
          errors={controller.errors["contextA"]}
        />
      </div>
      <ProcessTable 
        name="Process B"
        process={controller.processB}
        checkpoint={controller.checkpoint.processB}
        errors={controller.errors["processB"]}
        setState={controller.setProcessBState}
      />

      <div className="flex flex-col gap-[12px]">
        <KernelStackDisplay
          name="Process B Kernel Stack"
          section="kStackB"
          kstack={controller.kstackB}
          copyField={(field, value) => controller.copyField("kStackB", field, value, [Step.TRAP_RET, Step.I_RET].includes(controller.step))}
          pasteField={controller.setStackBField}
          copy={controller.copy}
          checkpoint={controller.checkpoint.kstackB}
          errors={controller.errors["kStackB"]}
        />
        <ContextTable 
          name="Process B Context"
          section="contextB"
          checkpoint={controller.checkpoint.processB.context}
          context={controller.processB.context}
          controller={controller}
          updateField={controller.setProcessBContextField}
          errors={controller.errors["contextB"]}
          
        />
      </div>
      <CPU controller={controller} />
    </div>
  );
};
