import React from "react";
import type { Thread, ThreadsController } from "../types";
import { Lock, LockOpen, Flag, LayersOne } from "@mynaui/icons-react";
import tailwindcolors from "tailwindcss/colors";
import { CodeTooltip } from "./CodeTooltip";
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
        <CodeTooltip code={`Pthread_mutex_lock(&${lock.id});`}>
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
        </CodeTooltip>
      ))}

      {(thread.locks ?? []).map((lock, index) => (
        <CodeTooltip code={`Pthread_mutex_unlock(&${lock.id});`}>
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
        </CodeTooltip>
      ))}

      {(thread.semaphores ?? []).map((sem, index) =>
        sem.posts.map((post, postIndex) => (
          <CodeTooltip code={`sem_post(&${sem.id});`}>
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
          </CodeTooltip>
        ))
      )}
      {(thread.semaphores ?? []).map((sem, index) =>
        sem.waits.map((wait, waitIndex) => (
          <CodeTooltip code={`sem_wait(&${sem.id});`}>
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
          </CodeTooltip>
        ))
      )}

      {(thread.conditionVariables ?? []).map((cv, index) =>
        cv.signals.map((sig, sigIndex) => (
          <CodeTooltip code={`Pthread_cond_signal(&${cv.id});`}>
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
          </CodeTooltip>
        ))
      )}

      {(thread.conditionVariables ?? []).map((cv, index) =>
        cv.waits.map((wait, waitIndex) => (
          <CodeTooltip
            code={`while (${cv.conditionStr})\n\tPthread_cond_wait(&${cv.id}, &${cv.releases});`}
          >
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
          </CodeTooltip>
        ))
      )}
    </div>
  );
};
