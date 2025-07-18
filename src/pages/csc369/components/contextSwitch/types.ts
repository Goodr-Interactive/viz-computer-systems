export enum ProcessState { 
    UNUSED, 
    EMBRYO, 
    SLEEPING,
    RUNNABLE, 
    RUNNING, 
    ZOMBIE 
};

export interface Context {
    eip: number;
    esp: number;
    ebx: number;
    ecx: number;
    edx: number;
    esi: number;
    edi: number;
    ebp: number;
}

export interface Process {
    pid: number;
    parent: string;
    mem: string;
    sz: number;
    kstack: string;
    state: ProcessState;
    chan: string;
    killed: number;
    ofile: Array<string>;
    cwd: string;
    context: Context;
    tf: string;
}

export interface KernelStack {
    eip: number;
    esp: number;
    ebx: number;
    esi: number;
    edi: number;
}

interface CPU {
    EAX: number;
    EBX: number;
    ECX: number;
    EDX: number;
    ESI: number;
    EDI: number;
    EBP: number;
    ESP: number;
    EIP: number;
    CS: number;
    DS: number;
    ES: number;
    FS: number; 
    GS: number;
    SS: number;
    IDTR: number;

}
