import React from "react";
import type { Thread, ThreadsController } from "../types";
import { Lock, LockOpen, Flag, LayersOne } from "@mynaui/icons-react";
import tailwindcolors from "tailwindcss/colors";

interface Props {
  thread: Thread;
  controller: ThreadsController;
}

export const ResourceTimeline: React.FunctionComponent<Props> = ({ thread, controller }) => {
  const getVerticalPosition = (ts: number): string => {
    return `calc(${((ts / thread.timeSteps) * 100).toFixed(0)}% - 8px)`;
  };

  return (
    <div className="relative h-full w-[14px]">
      {/* {thread.semaphores.map((sem) => (
        <></>
      ))} */}
      {(thread.locks ?? []).map((lock, index) => (
        <Lock
          strokeWidth={2}
          className={`absolute`}
          style={{
            top: getVerticalPosition(lock.acquireAt),
          }}
          // @ts-expect-error tailwindcolors
          color={tailwindcolors[controller.colors[lock.id]][500]}
          size={14}
          key={`${lock.id}-${index}-acquire`}
        />
      ))}

      {(thread.locks ?? []).map((lock, index) => (
        <LockOpen
          strokeWidth={2}
          className={`absolute`}
          style={{
            top: getVerticalPosition(lock.releaseAt),
          }}
          // @ts-expect-error tailwindcolors
          color={tailwindcolors[controller.colors[lock.id]][500]}
          size={14}
          key={`${lock.id}-${index}-release`}
        />
      ))}

      {(thread.semaphores ?? []).map((sem, index) =>
        sem.posts.map((post, postIndex) => (
          <Flag
            strokeWidth={2}
            className={`absolute`}
            style={{
              top: getVerticalPosition(post),
            }}
            // @ts-expect-error tailwindcolors
            color={tailwindcolors[controller.colors[sem.id]][500]}
            size={14}
            key={`${sem.id}-${index}-${postIndex}-post`}
          />
        ))
      )}
      {(thread.semaphores ?? []).map((sem, index) =>
        sem.waits.map((wait, waitIndex) => (
          <Flag
            strokeWidth={2}
            className={`absolute`}
            style={{
              top: getVerticalPosition(wait),
            }}
            // @ts-expect-error tailwindcolors
            color={tailwindcolors[controller.colors[sem.id]][500]}
            // @ts-expect-error tailwindcolors
            fill={tailwindcolors[controller.colors[sem.id]][500]}
            size={14}
            key={`${sem.id}-${index}-${waitIndex}-wait`}
          />
        ))
      )}

      {(thread.conditionVariables ?? []).map((cv, index) =>
        cv.signals.map((sig, sigIndex) => (
          <LayersOne
            strokeWidth={2}
            className={`absolute`}
            style={{
              top: getVerticalPosition(sig),
            }}
            // @ts-expect-error tailwindcolors
            color={tailwindcolors[controller.colors[cv.id]][500]}
            size={14}
            key={`${cv.id}-${index}-${sigIndex}-signal`}
          />
        ))
      )}
      {(thread.conditionVariables ?? []).map((cv, index) =>
        cv.waits.map((wait, waitIndex) => (
          <LayersOne
            strokeWidth={2}
            className={`absolute`}
            style={{
              top: getVerticalPosition(wait),
            }}
            // @ts-expect-error tailwindcolors
            color={tailwindcolors[controller.colors[cv.id]][500]}
            // @ts-expect-error tailwindcolors
            fill={tailwindcolors[controller.colors[cv.id]][500]}
            size={14}
            key={`${cv.id}-${index}-${waitIndex}-wait`}
          />
        ))
      )}
    </div>
  );
};
