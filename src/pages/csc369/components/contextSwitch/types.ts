export enum ProcessState { 
    UNUSED = "UNUSED", 
    EMBRYO = "EMBRYO", 
    SLEEPING = "SLEEPING",
    RUNNABLE = "RUNNABLE", 
    RUNNING = "RUNNING", 
    ZOMBIE = "ZOMBIE"
};

export interface Context {
    eip: string;
    esp: string;
    ebx: string;
    ecx: string;
    edx: string;
    esi: string;
    edi: string;
    ebp: string;
}

export interface Process {
    pid: number;
    parent: number;
    mem: string;
    sz: number;
    kstack: string;
    state: ProcessState;
    chan: number;
    killed: number;
    ofile: Array<string>;
    cwd: string;
    context: Context;
    tf: string;
}

export interface KernelStack {
    eip: string;
    esp: string;
    ebx: string;
    edx: string;
    esi: string;
    edi: string;
    ecx: string;
    ebp: string;
}

export interface CPU {
    ESP: string;
    EIP: string;
    EDI: string;
    EBX: string;
    ESI: string;
    ECX: string;
    EBP: string;
    EDX: string;
}
