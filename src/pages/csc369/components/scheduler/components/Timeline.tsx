import React from "react";
import { EventType, type SchedulerController, type SchedulerEvent } from "../types";
import _ from "lodash";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../../components/ui/tooltip";

interface Props {
  controller: SchedulerController;
}

export const Timeline: React.FunctionComponent<Props> = ({ controller }) => {
  console.log(controller);
  const processEvents = _.groupBy(
    controller.events.filter((e) => e.type !== EventType.TIMER_INTERRUPT),
    (e) => e.pid
  );
  const groupedEvents = Object.entries(processEvents).map(([__, events]) =>
    _.chunk(events, 2)
  ) as Array<Array<[SchedulerEvent, SchedulerEvent]>>;

  const getPosition = (ts: number) => {
    return `${((ts / controller.clock) * 100).toFixed(2)}%`;
  };

  const getWidth = (start: number, end: number) => {
    return `${(((end - start) / controller.clock) * 100).toFixed(2)}%`;
  };

  // const getTop = (index: number) => {
  //   return `${((index / controller.processes.length) * 100).toFixed(2)}%`;
  // };

  // const height = `${(100 / controller.processes.length).toFixed(2)}%`;

  if (
    groupedEvents.some((group) =>
      group.some(
        (pair) =>
          pair[0].type !== EventType.EXECUTED ||
          (pair[1].type !== EventType.SUSPENDED && pair[1].type !== EventType.EXITED)
      )
    )
  ) {
    return null;
  }

  const schedulingEvents = controller.events.filter((e) => e.type !== EventType.TIMER_INTERRUPT);

  const contextSwitches = [
    [
      {
        pid: 0,
        timestamp: 0,
      },
      schedulingEvents[0],
    ],
    ..._.chunk(schedulingEvents.slice(1), 2),
  ];

  const formatTimestamp = (ts: number): string => {
    return `${(ts / 1000).toFixed(1)}s`;
  };

  return (
    <TooltipProvider>
      <div className="relative mt-[50px] h-[225px] w-full overflow-hidden">
        {groupedEvents.flatMap((events) =>
          events.map((e) => (
            <div
              className="absolute flex h-full"
              style={{
                top: 0,
                width: getWidth(e[0].timestamp, e[1].timestamp),
                left: getPosition(e[0].timestamp),
              }}
            >
              <Tooltip key={`${e[0].pid}${e[0].timestamp}`}>
                <TooltipTrigger className="w-full">
                  <div
                    className={`flex h-full w-full items-center justify-center rounded-xs bg-gray-200 text-xs text-gray-800`}
                  >
                    PID:{e[0].pid}
                  </div>
                </TooltipTrigger>

                <TooltipContent>
                  <p>
                    PID:{e[0].pid} – Duration: {formatTimestamp(e[1].timestamp - e[0].timestamp)},
                    Start: {formatTimestamp(e[0].timestamp)}, End: {formatTimestamp(e[1].timestamp)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))
        )}

        {contextSwitches.map(
          (cs) =>
            cs[0] &&
            cs[1] && (
              <div
                className="absolute flex h-full"
                style={{
                  width: getWidth(cs[0].timestamp, cs[1].timestamp),
                  left: getPosition(cs[0].timestamp),
                }}
              >
                <Tooltip key={`cs:${cs[0].timestamp}`}>
                  <TooltipTrigger className="w-full">
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-xs bg-purple-200 text-xs text-purple-800`}
                    >
                      CS
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Context Switch – Duration:{" "}
                      {formatTimestamp(cs[1].timestamp - cs[0].timestamp)}, Start:{" "}
                      {formatTimestamp(cs[0].timestamp)}, End: {formatTimestamp(cs[1].timestamp)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )
        )}
      </div>
    </TooltipProvider>
  );
};
