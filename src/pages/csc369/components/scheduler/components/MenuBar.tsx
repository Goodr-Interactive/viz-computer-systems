import React from "react";
import { Algorithm, SchedulerState, type SchedulerController } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
interface Props {
  controller: SchedulerController;
  allowedAlgorithms?: Array<Algorithm>;
}

export const MenuBar: React.FunctionComponent<Props> = ({ controller, allowedAlgorithms }) => {

  const algorithms = allowedAlgorithms ?? [
    Algorithm.FCFS,
    Algorithm.SJF,
    Algorithm.SCTF,
    Algorithm.RR,
    Algorithm.CFS,
  ]

  return (
    <div className="flex h-full w-full items-center justify-between px-[12px]">
      <div className="flex items-center gap-[24px]">
        <Select
          disabled={controller.state === SchedulerState.RUNNING}
          onValueChange={controller.setAlgorithm}
          defaultValue={controller.algorithm}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Algorithm" />
          </SelectTrigger>
          <SelectContent>
            {algorithms.map(alg => (
              <SelectItem key={alg} value={alg}>{alg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-[8px]">
          <Switch onCheckedChange={controller.setQuizMode} checked={controller.quizMode} />
          <Label>Quiz Mode</Label>
        </div>
      </div>
    </div>
  );
};
