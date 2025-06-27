import React from "react";
import type { ThreadsController } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lock, Flag } from "@mynaui/icons-react";
import tailwindcolors from "tailwindcss/colors";

interface Props {
  controller: ThreadsController;
}

export const ResourceDisplay: React.FunctionComponent<Props> = ({ controller }) => {
  return (
    <div className="flex h-full w-full flex-col gap-[12px] p-[12px]">
      <h1 className="text-xl font-medium tracking-tight">Resources</h1>
      {controller.locks.length ? (
        <div className="flex flex-col">
          <span className="font-medium text-lg">Locks</span>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]"></TableHead>
                <TableHead>Held By</TableHead>
                <TableHead>Waited By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controller.locks.map((lock) => (
                <TableRow>
                  <TableCell className="flex gap-[4px] items-center">
                     {/** @ts-expect-error tailwind */}
                    <Lock size={16} color={tailwindcolors[controller.colors[lock.id]][500]}/> {lock.id}
                 </TableCell>
                  <TableCell>{controller.lockState[lock.id]?.heldBy ?? "None"}</TableCell>
                  <TableCell>{(controller.lockState[lock.id]?.waiting.length ? controller.lockState[lock.id].waiting : ["None"]).join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {controller.semaphores.length ? (
        <>
          <span>Semaphores</span>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]"></TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Waiting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controller.semaphores.map((sem) => (
                <TableRow>
                  <TableCell className="font-medium flex gap-[4px] items-center">
                    {/** @ts-expect-error tailwind */}
                    <Flag fill={tailwindcolors[controller.colors[sem.id]][500]} size={16} color={tailwindcolors[controller.colors[sem.id]][500]}/> {sem.id}
                </TableCell>
                  <TableCell>{controller.semaphoreState[sem.id]?.count ?? sem.initial}</TableCell>
                  <TableCell>
                  {(controller.semaphoreState[sem.id]?.waiting.length ? controller.semaphoreState[sem.id].waiting : ["None"]).join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
};
