import type { Context, KernelStack, Process } from "./types";

export const getKernelStackDescription = (field: keyof KernelStack): string => {
  switch (field) {
    case "eip":
      return "Instruction Pointer - Points to the next instruction to execute in kernel mode";
    case "esp":
      return "Stack Pointer - Points to the top of the kernel stack";
    case "ebx":
      return "Base Register - General purpose register used for addressing";
    case "esi":
      return "Source Index - Source operand for string operations";
    case "edi":
      return "Destination Index - Destination operand for string operations";
    default:
      return "Unknown kernel stack field";
  }
};

export const getProcessDescription = (field: keyof Process): string => {
  switch (field) {
    case "pid":
      return "Process ID - Unique identifier for the process";
    case "parent":
      return "Parent Process - Reference to the parent process";
    case "mem":
      return "Memory - Memory allocation information";
    case "sz":
      return "Size - Size of the process memory";
    case "kstack":
      return "Kernel Stack - Pointer to kernel stack for this process";
    case "state":
      return "State - Current state of the process (UNUSED, EMBRYO, SLEEPING, RUNNABLE, RUNNING, ZOMBIE)";
    case "chan":
      return "Channel - Synchronization channel for sleeping processes";
    case "killed":
      return "Killed - Flag indicating if process was terminated";
    case "ofile":
      return "Open Files - Array of open file descriptors";
    case "cwd":
      return "Current Working Directory - Current directory path";
    case "context":
      return "Context - CPU context saved during context switch";
    case "tf":
      return "Trap Frame - Trap/interrupt frame information";
    default:
      return "Unknown process field";
  }
};

export const getContextDescription = (field: keyof Context) => {
  switch (field) {
    case "eip":
      return "Instruction Pointer - Points to the next instruction to execute";
    case "esp":
      return "Stack Pointer - Points to the top of the user stack";
    case "ebx":
      return "Base Register - General purpose register for addressing";
    case "ecx":
      return "Counter Register - Loop counter and general purpose";
    case "edx":
      return "Data Register - General purpose register for data";
    case "esi":
      return "Source Index - Source operand for string operations";
    case "edi":
      return "Destination Index - Destination operand for string operations";
    case "ebp":
      return "Base Pointer - Points to the base of the current stack frame";
    default:
      return "Unknown context field";
  }
};
