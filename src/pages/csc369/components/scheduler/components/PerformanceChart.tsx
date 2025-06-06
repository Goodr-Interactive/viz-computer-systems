import React, { useMemo } from "react";
import type { Process } from "../types";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartLegend } from "@/components/ui/chart";
import { getResponseTime, getTurnaroundTime, getWaitTime } from "../utils";

interface Props {
  clock: number;
  processes: Process[];
}

export const PerformanceChart: React.FunctionComponent<Props> = ({ processes, clock }) => {
  const chartData = useMemo(
    () =>
      processes.map((p) => ({
        pid: p.pid,
        wait: getWaitTime(p, clock) / 1000,
        response: getResponseTime(p, clock) / 1000,
        turnaround: getTurnaroundTime(p, clock) / 1000,
      })),
    [processes, clock]
  );

  const chartConfig = {
    wait: {
      label: "Wait Time",
      color: "var(--chart-2)",
    },
    response: {
      label: "Response Time",
      color: "var(--chart-1)",
    },
    turnaround: {
      label: "Turnaround Time",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <ChartLegend />
        <XAxis
          dataKey="pid"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => `PID:${value}`}
        />
        <YAxis axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent labelKey={"pid"} />} />
        <Bar dataKey="wait" fill="var(--chart-2)" radius={4} />
        <Bar dataKey="response" fill="var(--chart-1)" radius={4} />
        <Bar dataKey="turnaround" fill="var(--chart-5)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
};
