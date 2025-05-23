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
import { Play, Columns, Undo } from "@mynaui/icons-react";
import { IconButton } from "./IconButton";

interface Props {
  controller: SchedulerController;
}

export const MenuBar: React.FunctionComponent<Props> = ({ controller }) => {
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
            <SelectItem value={Algorithm.FCFS}>{Algorithm.FCFS}</SelectItem>
            <SelectItem value={Algorithm.SJF}>{Algorithm.SJF}</SelectItem>
            <SelectItem value={Algorithm.SCTF}>{Algorithm.SCTF}</SelectItem>
            <SelectItem value={Algorithm.RR}>{Algorithm.RR}</SelectItem>
            <SelectItem value={Algorithm.CFS}>{Algorithm.CFS}</SelectItem>
            <SelectItem value={Algorithm.DIY}>{Algorithm.DIY}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-[8px]">
          <Switch onCheckedChange={controller.setQuizMode} checked={controller.quizMode} />
          <Label>Quiz Mode</Label>
        </div>
      </div>
      <div className="flex gap-[12px]">
        {controller.state !== SchedulerState.RUNNING && (
          <IconButton onClick={controller.play}>
            <Play height={30} width={30} />
          </IconButton>
        )}

        {controller.state !== SchedulerState.PAUSED && (
          <IconButton onClick={controller.pause}>
            <Columns height={24} width={24} />
          </IconButton>
        )}

        <IconButton onClick={controller.reset}>
          <Undo height={24} width={24} />
        </IconButton>
      </div>
    </div>
  );
};
