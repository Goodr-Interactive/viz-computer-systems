import React from "react";
import type { SchedulerController } from "../types";

interface Props {
    controller: SchedulerController;
}

export const DirectExecution : React.FunctionComponent<Props> = ({
    controller
}) => {
    return (
        <div className="w-full h-full p-[12px]">
            <h1 className="text-xl font-medium tracking-tight">
                Direct Execution
            </h1>
        </div>
    )
}
