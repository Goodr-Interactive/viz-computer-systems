import type { Context, CPU, KernelStack, Process } from "./types";

export const getKernelStackDescription = (field: keyof KernelStack): string => {
  switch (field) {
    case "EFLAGS":
      return "Status Flags - Contains processor status and control flags";
    case "CS":
      return "Code Segment - Points to the current code segment";
    case "SS":
      return "Stack Segment - Points to the current stack segment";
    case "EIP":
      return "Instruction Pointer - Points to the next instruction to execute in kernel mode";
    case "ESP":
      return "Stack Pointer - Points to the top of the kernel stack";
    case "EBX":
      return "Base Register - General purpose register used for addressing";
    case "ESI":
      return "Source Index - Source operand for string operations";
    case "EDI":
      return "Destination Index - Destination operand for string operations";
    case "ECX":
      return "Counter Register - Used as a loop counter and for general purposes";
    case "EDX":
      return "Data Register - Primarily used for arithmetic operations, I/O operations, and as a general-purpose register for data manipulation";
    case "EBP":
      return "Base Pointer - Points to the base of the current stack frame";
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

export const getCPUDescription = (field: keyof CPU): string => {
  switch (field) {
    case "EIP":
      return "Instruction Pointer - Points to the next instruction to execute";
    case "EFLAGS":
      return "Status Flags - Contains processor status and control flags";
    case "ESP":
      return "Stack Pointer - Points to the top of the current stack";
    case "EDI":
      return "Destination Index - Destination operand for string operations";
    case "EBX":
      return "Base Register - General purpose register used for addressing";
    case "ESI":
      return "Source Index - Source operand for string operations";
    case "ECX":
      return "Counter Register - Used as a loop counter and for general purposes";
    case "EBP":
      return "Base Pointer - Points to the base of the current stack frame";
    case "EDX":
      return "Data Register - Primarily used for arithmetic operations, I/O operations, and as a general-purpose register for data manipulation";
    case "CS":
      return "Code Segment - Points to the current code segment";
    case "SS":
      return "Stack Segment - Points to the current stack segment";
    default:
      return "Unknown CPU register";
  }
};
