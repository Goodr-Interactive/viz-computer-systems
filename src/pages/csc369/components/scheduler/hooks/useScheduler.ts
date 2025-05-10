import { useState } from "react";
import { type SchedulerController, type Process, Algorithm, SchedulerState } from "../types";



export const useScheduler = () : SchedulerController => {
    const [state, setState] = useState<SchedulerState>(SchedulerState.PAUSED);
    const [processes, setProcesses] = useState<Array<Process>>([]);
    const [contextSwitchFrequency, setContextSwitchFrequency] = useState<number>(5);
    const [contextSwitchDuration, setContextSwitchDuration] = useState<number>(2);
    const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.FCFS);
    const [quizMode, setQuizMode] = useState<boolean>(false);


    const addProcess = (process: Process) => {
        setProcesses(ps => [...ps, process]);
    }
    
    const pause =  () => {
        setState(SchedulerState.PAUSED);
    };
    const play = () => {
        setState(SchedulerState.RUNNING);
    };
    const reset =  () => {
        setState(SchedulerState.PAUSED);
        setProcesses([]);
    };

    return {
        state,
        processes,
        addProcess,
        contextSwitchDuration,
        setContextSwitchDuration,
        contextSwitchFrequency,
        setContextSwitchFrequency,
        algorithm,
        setAlgorithm,
        pause,
        play,
        reset,
        quizMode,
        setQuizMode
    }
}
