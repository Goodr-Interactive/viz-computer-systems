import React from "react";
import type { ThreadsController } from "../types";
import tailwindcolors from "tailwindcss/colors";
interface Props {
  controller: ThreadsController;
}

export const Legend: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="h-full w-full p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Legend</h1>
      <div className="flex flex-wrap gap-[28px] py-[12px]">
        {Object.entries(controller.colors).map(([id, color], index) => (
          <div className="flex items-center gap-[8px]" key={index}>
            <div
              className="h-[12px] w-[12px] rounded-xs"
              // @ts-expect-error tailwindcolors
              style={{ backgroundColor: tailwindcolors[color][500] }}
            />
            <span className="text-sm">{id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
