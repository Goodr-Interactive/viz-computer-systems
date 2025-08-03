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
    SS: string;
    CS: string;
    EFLAGS: string;   
    EIP: string;
    ESP: string;
    EBX: string;
    EDX: string;
    ESI: string;
    EDI: string;
    ECX: string;
    EBP: string;
}

export interface CPU {
    // Instruction Pointer
    EIP: string;

    // Status Flags
    EFLAGS: string;

    // General Purpose
    ESP: string;
    EDI: string;
    EBX: string;
    ESI: string;
    ECX: string;
    EBP: string;
    EDX: string;

    // Segment Registers
    CS: string;
    SS: string;
}


export enum Step {
    USER_TO_KERNEL = "USER_TO_KERNEL",
    TRAP_ENTRY = "TRAP_ENTRY",
    TRAP_HANDLER = "TRAP_HANDLER",
    RETURN_IN_KERNEL = "RETURN_IN_KERNEL",
    TRAP_RET = "TRAP_RET",
    I_RET = "I_RET",
}
