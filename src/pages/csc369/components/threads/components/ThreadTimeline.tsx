import React from "react";
import type { Thread, ThreadsController } from "../types";
import tailwindcolors from "tailwindcss/colors";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ThreadTimeline: React.FunctionComponent<Props> = ({ thread, controller }) => {
  const getVerticalPosition = (ts: number): string => {
    return `${((ts / thread.timeSteps) * 100).toFixed(0)}%`;
  };

  const getHeight = (start: number, end: number): string => {
    const percent = ((end - start) / thread.timeSteps) * 100;
    return `${percent.toFixed(0)}%`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xs bg-gray-200">
      {thread.criticalSections.map((cs, index) => (
        <div
          key={`${cs.id}-${index}`}
          className={`absolute flex w-full items-center justify-center text-xs`}
          style={{
            top: getVerticalPosition(cs.startAt),
            height: getHeight(cs.startAt, cs.endAt),
            // @ts-expect-error tailwindcolors
            backgroundColor: tailwindcolors[controller.colors[cs.id]][200],
            // @ts-expect-error tailwindcolors
            color: tailwindcolors[controller.colors[cs.id]][500],
          }}
        >
          {cs.id}
        </div>
      ))}
      {/* {thread.semaphores.map((sem) => (
        <></>
      ))} */}
      {thread.locks.map((lock, index) => (
        <div
          key={`${lock.id}-${index}-acquire`}
          className={`absolute h-[3px] w-full`}
          style={{
            top: getVerticalPosition(lock.acquireAt),
            // @ts-expect-error tailwindcolors
            backgroundColor: tailwindcolors[controller.colors[lock.id]][500],
          }}
        />
      ))}

      {thread.locks.map((lock, index) => (
        <div
          key={`${lock.id}-${index}-release`}
          className={`absolute h-[3px] w-full border-[1.5px] border-dashed`}
          style={{
            top: getVerticalPosition(lock.releaseAt),
            // @ts-expect-error tailwindcolors
            borderColor: tailwindcolors[controller.colors[lock.id]][500],
          }}
        />
      ))}

      <div
        className={"absolute h-[3px] w-full rounded-md bg-black"}
        style={{ top: getVerticalPosition(controller.threadState[thread.id].timeStep) }}
      />
    </div>
  );
};
