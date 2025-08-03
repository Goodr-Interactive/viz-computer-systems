import React from "react";
import type { ContextSwitchController } from "../hooks";
import { Step } from "../types";

interface Props {
  controller: ContextSwitchController;
}

export const StepTitle: React.FunctionComponent<Props> = ({ controller }) => {
  const getStepTitle = (step: Step) => {
    switch (step) {
      case Step.USER_TO_KERNEL:
        return "Step 1: Kernel Mode → User Mode (CPU)";
      case Step.TRAP_ENTRY:
        return "Step 2: Register Saving (OS)";
      case Step.TRAP_HANDLER:
        return "Step 3: Kernel Trap Handler (OS)";
      case Step.RETURN_IN_KERNEL:
        return "Step 4: Process B Resumes in Kernel Mode (OS)"
      case Step.TRAP_RET:
        return "Step 5: Process B trapret (OS)";
      case Step.I_RET:
        return "Step 6: Proces B iret (CPU)";
    }
  };

  const getStepDescription = (step: Step) => {
    switch (step) {
      case Step.USER_TO_KERNEL:
        return "When transitioning from user mode to kernel mode due to a trap or interrupt, the CPU automatically pushes some registers onto the process's kernel stack.";
      case Step.TRAP_ENTRY:
        return "The xv6 trap entry point (trapasm.S) manually pushes the general-purpose registers onto the process's kernel stack.";
      case Step.TRAP_HANDLER:
        return "The trap handler calls yield() which updates the process's state, and then saves the callee-saved registers to the process's context";
      case Step.RETURN_IN_KERNEL:
        return "The scheduler selects Process B to run next, and updates it's state. The process begins execution in Kernel Mode, to complete it's trap() call."
      case Step.TRAP_RET:
        return "the trapret function is an assembly routine that restores all user-mode registers from the trapframe on the kernel stack and executes iret to return control from kernel mode back to user mode."
      case Step.I_RET:
        return "iret is a CPU instruction that atomically restores some registers to the CPU, resuming execution at the point where the interrupt or trap occurred.";
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-between p-[12px]">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-lg font-bold">{getStepTitle(controller.step)}</h1>
        <p className="text-muted-foreground text-sm">{getStepDescription(controller.step)}</p>
      </div>
    </div>
  );
};
