import React from "react";
import type { Thread, ThreadsController } from "../types";


interface Props {
    thread: Thread;
}


export const ThreadTimeline : React.FunctionComponent<Props> = ({
    thread
}) => {

    return (
        <div className="rounded-md bg-grey position-relative">
            {thread.criticalSections.map(cs => (
                <div key={cs.id}></div>
            ))}
            {thread.semaphores.map(sem => (
                <div></div>
            ))}
            {thread.locks.map(lock => (
                <div></div>
            ))}
            <div></div>
        </div>
    )
}
