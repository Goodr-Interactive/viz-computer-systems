import React from "react";
import { EventType, type SchedulerController, type SchedulerEvent } from "../types";
import _ from "lodash";

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

  const getTop = (index: number) => {
    return `${((index / controller.processes.length) * 100).toFixed(2)}%`;
  };

  const height = `${(100 / controller.processes.length).toFixed(2)}%`;

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

  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      {groupedEvents.flatMap((events, index) =>
        events.map((e) => (
          <div
            key={`${e[0].pid}${e[0].timestamp}`}
            className={`absolute flex w-full items-center justify-center rounded-xs bg-gray-200 text-xs text-gray-800`}
            style={{
              top: getTop(index),
              width: getWidth(e[0].timestamp, e[1].timestamp),
              left: getPosition(e[0].timestamp),
              height,
            }}
          >
            PID:{e[0].pid}
          </div>
        ))
      )}

      {contextSwitches.map(
        (cs) =>
          cs[0] &&
          cs[1] && (
            <div
              key={`cs:${cs[0].timestamp}`}
              className={`absolute flex h-full w-full items-center justify-center rounded-xs bg-purple-200 text-xs text-purple-800`}
              style={{
                width: getWidth(cs[0].timestamp, cs[1].timestamp),
                left: getPosition(cs[0].timestamp),
              }}
            />
          )
      )}
    </div>
  );
};
