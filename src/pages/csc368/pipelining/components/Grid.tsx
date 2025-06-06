import React from "react";

interface GridProps {
  scale: d3.ScaleBand<string>;
  ticks: Array<string | number>;
  orientation: "horizontal" | "vertical";
  length: number;
}

export const Grid: React.FC<GridProps> = ({ scale, ticks, orientation, length }) => {
  return (
    <g className="grid">
      {ticks.map((tick, i) => (
        <line
          key={`grid-${orientation}-${i}`}
          x1={orientation === "vertical" ? scale(String(tick))! : 0}
          x2={orientation === "vertical" ? scale(String(tick))! : length}
          y1={orientation === "horizontal" ? scale(String(tick))! + scale.bandwidth() : 0}
          y2={orientation === "horizontal" ? scale(String(tick))! + scale.bandwidth() : length}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      ))}
    </g>
  );
};
