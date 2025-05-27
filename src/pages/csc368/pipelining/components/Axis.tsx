import React from "react";
import * as d3 from "d3";
import type { Instruction } from "./types";

interface AxisProps {
  scale: d3.ScaleBand<string>;
  orient: "bottom" | "left";
  transform?: string;
  tickFormat?: (domainValue: string, index: number) => string;
  timeLabels?: string[];
  instructions?: Instruction[];
  label?: string;
  labelOffset?: { x: number; y: number };
}

export const Axis: React.FC<AxisProps> = ({
  scale,
  orient,
  transform,
  tickFormat,
  timeLabels,
  instructions,
  label,
  labelOffset = { x: 0, y: 0 },
}) => {
  const ref = React.useRef<SVGGElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const g = d3.select(ref.current);
    g.selectAll("*").remove();

    let axis;
    if (orient === "bottom") {
      axis = d3.axisBottom(scale);
      if (timeLabels && timeLabels.length > 0) {
        axis = axis.tickFormat((_, i) => timeLabels[i] || "");
      }
    } else {
      axis = d3.axisLeft(scale);
      if (instructions && instructions.length > 0) {
        axis = axis.tickFormat((d) => {
          const instr = instructions.find((i) => i.id.toString() === d);
          return instr ? instr.name : d;
        });
      }
    }

    g.call(axis);

    if (orient === "bottom") {
      // Adjust tick position to align with the left edge of each band
      g.selectAll(".tick").attr("transform", function() {
        const tickValue = d3.select(this).datum();
        return `translate(${scale(String(tickValue))},0)`;
      });

      // Rotate the tick labels
      g.selectAll("text")
        .attr("transform", "rotate(60)")
        .attr("text-anchor", "start")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em");
    }

    // Add axis label
    if (label) {
      g.append("text")
        .attr("transform", orient === "left" ? "rotate(-90)" : "")
        .attr("y", labelOffset.y)
        .attr("x", labelOffset.x)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text(label);
    }
  }, [scale, orient, transform, tickFormat, timeLabels, instructions, label, labelOffset]);

  return <g ref={ref} transform={transform}></g>;
};
