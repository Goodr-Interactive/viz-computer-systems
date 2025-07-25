import { useState } from "react";
import { type CPU, type KernelStack, type Process, ProcessState } from "../types";

export interface ContextSwitchController {
  kstackA: KernelStack;
  kstackB: KernelStack;
  processA: Process;
  processB: Process;
  setStackAField: (field: keyof KernelStack, value: KernelStack[keyof KernelStack]) => void;
  setStackBField: (field: keyof KernelStack, value: KernelStack[keyof KernelStack]) => void;
  copyField: (context: string, field: string, value: string | number) => void;
  copy: Copy | undefined;
  checkpoint: Checkpoint;
  CPU: CPU;
}

const randomHex = () => {
  return (
    "0x" +
    Math.floor(Math.random() * 65536)
      .toString(16)
      .padStart(8, "0")
  );
};

const initialKStack = (): KernelStack => {
  return {
    eip: randomHex(),
    esp: randomHex(),
    ebx: randomHex(),
    esi: randomHex(),
    edi: randomHex(),
    ebp: randomHex(),
    ecx: randomHex(),
    edx: randomHex(),
  };
};

const initialCPU = () : CPU => {
  return {
    ESP: randomHex(),
    EIP: randomHex(),
    ECX: randomHex(),
    EBX: randomHex(),
    ESI: randomHex(),
    EBP: randomHex(),
    EDX: randomHex(),
    EDI: randomHex(),
  }
}

const initialProcess = (pid: number, running: boolean): Process => {
  return {
    pid,
    parent: 2,
    mem: randomHex(),
    sz: 0,
    kstack: randomHex(),
    state: running ? ProcessState.RUNNING : ProcessState.SLEEPING,
    chan: 2,
    killed: 0,
    ofile: [randomHex()],
    cwd: "  .",
    context: {
      eip: randomHex(),
      esp: randomHex(),
      ebx: randomHex(),
      ecx: randomHex(),
      edx: randomHex(),
      esi: randomHex(),
      edi: randomHex(),
      ebp: randomHex(),
    },
    tf: randomHex(),
  };
};

export interface Copy {
    context: string;
    field: string;
    value: string | number;
}

export interface Checkpoint {
  kstackA: KernelStack;
  kstackB: KernelStack;
  processA: Process;
  processB: Process;
  CPU: CPU;
}

export const useContextSwitchController = (): ContextSwitchController => {
  const [kstackA, setKStackA] = useState<KernelStack>(initialKStack());
  const [kstackB, setKStackB] = useState<KernelStack>(initialKStack());
  const [processA, setProcessA] = useState<Process>(initialProcess(12, true));
  const [processB, setProcessB] = useState<Process>(initialProcess(14, false));
  const [CPU, setCPU] = useState<CPU>(initialCPU());

  const [checkpoint, setCheckpoint] = useState<Checkpoint>({
    kstackA,
    kstackB,
    processA,
    processB,
    CPU
  })

  const [copy, setCopy] = useState<Copy>();

  const setStackAField = (field: keyof KernelStack, value: KernelStack[keyof KernelStack]) => {
    setKStackA((s) => ({ ...s, [field]: value }));
    setCopy(undefined);
  };

  const setStackBField = (field: keyof KernelStack, value: KernelStack[keyof KernelStack]) => {
    setKStackB((s) => ({ ...s, [field]: value }));
    setCopy(undefined);
  };

  const copyField = (context: string, field: string, value: string | number) => {
    setCopy({ context, field, value });
  };

  const step = () => {
    // validate state
    // move to next step if valid
  }

  return {
    processA,
    processB,
    kstackA,
    kstackB,
    setStackAField,
    setStackBField,
    copyField,
    copy,
    checkpoint,
    CPU
  };
};
