import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CacheSystem } from "./CacheSystem";
import { cacheConfig } from "./config";
import type { CacheSize, WordsPerLine, BytesPerWord } from "./types";

interface MemoryWord {
  id: number;
  lineIndex: number;
  wordIndex: number;
  isP1Access: boolean;
  isP2Access: boolean;
  variable: string;
}

interface CacheLine {
  id: number;
  words: MemoryWord[];
  isActive: boolean;
}

type SharingScenario = "false-sharing" | "true-sharing" | "no-sharing";

export const ConfigurableFalseSharingViz: React.FC = () => {
  const [animationState, setAnimationState] = useState<"p1" | "p2">("p1");
  const [containerWidth, setContainerWidth] = useState(800);
  const [scenario, setScenario] = useState<SharingScenario>("false-sharing");

  // Cache configuration state
  const [cacheSize, setCacheSize] = useState<CacheSize>(cacheConfig.defaults.cacheSize);
  const [wordsPerLine, setWordsPerLine] = useState<WordsPerLine>(cacheConfig.defaults.wordsPerLine);
  const [bytesPerWord, setBytesPerWord] = useState<BytesPerWord>(cacheConfig.defaults.bytesPerWord);

  // Create cache system
  const cacheSystem = new CacheSystem({ cacheSize, wordsPerLine, bytesPerWord });
  const metrics = cacheSystem.getMetrics();

  // Filter out words per line options that would result in only 1 cache line
  const getValidWordsPerLineOptions = () => {
    return cacheConfig.wordsPerLineOptions.filter(option => {
      const resultingLines = cacheSize / option.value;
      return resultingLines > 1; // Ensure we have at least 2 cache lines
    });
  };

  const validWordsPerLineOptions = getValidWordsPerLineOptions();

  const [randomConfig, setRandomConfig] = useState({
    line1Index: 2,
    p1WordIndex: 0,
    p2WordIndex: 3,
    line2Index: 4,
    p2Line2WordIndex: 0,
  });

  // Constants
  const TOTAL_LINES = metrics.totalLines;

  // Randomization function
  const randomizeConfiguration = () => {
    const line1Index = Math.floor(Math.random() * TOTAL_LINES);
    let line2Index;
    do {
      line2Index = Math.floor(Math.random() * TOTAL_LINES);
    } while (line2Index === line1Index);

    const p1WordIndex = Math.floor(Math.random() * metrics.wordsPerLine);
    let p2WordIndex;
    do {
      p2WordIndex = Math.floor(Math.random() * metrics.wordsPerLine);
    } while (p2WordIndex === p1WordIndex && scenario === "false-sharing");

    const p2Line2WordIndex = Math.floor(Math.random() * metrics.wordsPerLine);

    setRandomConfig({
      line1Index,
      p1WordIndex,
      p2WordIndex: scenario === "true-sharing" ? p1WordIndex : p2WordIndex,
      line2Index,
      p2Line2WordIndex,
    });
  };

  // Get scenario configuration
  const getScenarioConfig = () => {
    switch (scenario) {
      case "false-sharing":
        return {
          p1LineIndex: randomConfig.line1Index,
          p1WordIndex: randomConfig.p1WordIndex,
          p2LineIndex: randomConfig.line1Index, // Same line
          p2WordIndex: randomConfig.p2WordIndex,
          activeLine1: randomConfig.line1Index,
          activeLine2: null,
          title: "False Sharing",
          description: "Two processors accessing different variables in the same cache line",
          explanation:
            'P1 writes to variable A and P2 writes to variable B. Even though they access different variables, both variables are in the same cache line. This causes unnecessary "false" coherence traffic as the cache line bounces between processors.',
        };
      case "true-sharing":
        return {
          p1LineIndex: randomConfig.line1Index,
          p1WordIndex: randomConfig.p1WordIndex,
          p2LineIndex: randomConfig.line1Index, // Same line
          p2WordIndex: randomConfig.p1WordIndex, // Same word
          activeLine1: randomConfig.line1Index,
          activeLine2: null,
          title: "True Sharing",
          description: "Two processors accessing the same variable in the same cache line",
          explanation:
            'P1 and P2 both access the same variable X to write. This is "true" sharing where coherence traffic is necessary to maintain data consistency between processors.',
        };
      case "no-sharing":
        return {
          p1LineIndex: randomConfig.line1Index,
          p1WordIndex: randomConfig.p1WordIndex,
          p2LineIndex: randomConfig.line2Index, // Different line
          p2WordIndex: randomConfig.p2Line2WordIndex,
          activeLine1: randomConfig.line1Index,
          activeLine2: randomConfig.line2Index,
          title: "No Sharing",
          description: "Two processors accessing different variables in different cache lines",
          explanation:
            "P1 writes to variable A and P2 writes to variable B. Since they are in different cache lines, there is no coherence traffic between processors - this is the ideal scenario.",
        };
      default:
        return getScenarioConfig();
    }
  };

  const config = getScenarioConfig();

  // Create cache lines
  const cacheLines: CacheLine[] = [];
  for (let lineIndex = 0; lineIndex < TOTAL_LINES; lineIndex++) {
    const words: MemoryWord[] = [];
    for (let wordIndex = 0; wordIndex < metrics.wordsPerLine; wordIndex++) {
      const isP1Access = lineIndex === config.p1LineIndex && wordIndex === config.p1WordIndex;
      const isP2Access = lineIndex === config.p2LineIndex && wordIndex === config.p2WordIndex;

      let variable = "";
      if (isP1Access) {
        variable = scenario === "true-sharing" ? "X" : "A";
      } else if (isP2Access) {
        variable = scenario === "true-sharing" ? "X" : "B";
      }

      words.push({
        id: lineIndex * metrics.wordsPerLine + wordIndex,
        lineIndex,
        wordIndex,
        isP1Access,
        isP2Access,
        variable,
      });
    }

    const isActive = lineIndex === config.activeLine1 || lineIndex === config.activeLine2;

    cacheLines.push({
      id: lineIndex,
      words,
      isActive,
    });
  }

  // Animation effect - ping-pong every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState((prev) => (prev === "p1" ? "p2" : "p1"));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Responsive width handling
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("configurable-false-sharing-container");
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Re-randomize when cache configuration changes
  useEffect(() => {
    randomizeConfiguration();
  }, [cacheSize, wordsPerLine, bytesPerWord, scenario]);

  // Validate and reset wordsPerLine if it would result in only 1 cache line
  useEffect(() => {
    const validOptions = validWordsPerLineOptions.map(opt => opt.value);
    if (!validOptions.includes(wordsPerLine)) {
      // Reset to the smallest valid option (most cache lines)
      const smallestValid = validOptions[0];
      if (smallestValid) {
        setWordsPerLine(smallestValid);
      }
    }
  }, [cacheSize, validWordsPerLineOptions, wordsPerLine]);

  // Calculate dimensions
  const wordSize = Math.min(containerWidth / (metrics.wordsPerLine + 4), 50); // +4 for padding and labels
  const lineHeight = wordSize + 50; // Extra space between lines for P1 above and P2 below
  const lineWidth = metrics.wordsPerLine * wordSize;

  return (
    <div id="configurable-false-sharing-container" className="mx-auto w-full max-w-5xl p-4">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">{config.title}</h2>
        <p className="text-gray-600 mb-3">{config.description}</p>
        <p className="text-gray-700 text-sm max-w-4xl mx-auto">{config.explanation}</p>
      </div>

      {/* Scenario Selection */}
      <div className="mb-6 flex justify-center gap-2">
        <Button
          variant={scenario === "false-sharing" ? "default" : "outline"}
          onClick={() => setScenario("false-sharing")}
          className="text-sm"
        >
          False Sharing
        </Button>
        <Button
          variant={scenario === "true-sharing" ? "default" : "outline"}
          onClick={() => setScenario("true-sharing")}
          className="text-sm"
        >
          True Sharing
        </Button>
        <Button
          variant={scenario === "no-sharing" ? "default" : "outline"}
          onClick={() => setScenario("no-sharing")}
          className="text-sm"
        >
          No Sharing
        </Button>
      </div>

      {/* Configuration Controls */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cache-size" className="text-sm font-medium text-gray-700">
            Total Cache Size
          </Label>
          <Select
            value={cacheSize.toString()}
            onValueChange={(value) => setCacheSize(Number(value) as CacheSize)}
          >
            <SelectTrigger id="cache-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cacheConfig.cacheSizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="words-per-line" className="text-sm font-medium text-gray-700">
            Words per Cache Line
          </Label>
          <Select
            value={wordsPerLine.toString()}
            onValueChange={(value) => setWordsPerLine(Number(value) as WordsPerLine)}
          >
            <SelectTrigger id="words-per-line" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validWordsPerLineOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="bytes-per-word" className="text-sm font-medium text-gray-700">
            Bytes per Word
          </Label>
          <Select
            value={bytesPerWord.toString()}
            onValueChange={(value) => setBytesPerWord(Number(value) as BytesPerWord)}
          >
            <SelectTrigger id="bytes-per-word" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cacheConfig.bytesPerWordOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end">
          <Button
            onClick={randomizeConfiguration}
            variant="secondary"
            className="text-sm font-semibold"
          >
            Generate New Layout
          </Button>
        </div>
      </div>

      {/* Cache Lines Visualization */}
      <div className="mb-4 flex justify-center">
        <svg
          width={lineWidth + 200}
          height={TOTAL_LINES * lineHeight + 150}
          className="rounded-lg border border-gray-200"
        >
          {/* Cache Lines */}
          {cacheLines.map((line, lineIndex) => {
            const yPos = 50 + lineIndex * lineHeight;
            const isActiveLine = line.isActive;
            const hasP1Access = line.words.some((word) => word.isP1Access);
            const hasP2Access = line.words.some((word) => word.isP2Access);

            // Determine line color based on animation state and scenario
            let lineColor = "#e5e7eb"; // Default gray
            if (isActiveLine) {
              if (scenario === "no-sharing") {
                lineColor = "#6b7280"; // Gray for no-sharing
              } else if (hasP1Access && hasP2Access) {
                // Both processors access this line
                lineColor = animationState === "p1" ? "#ef4444" : "#3b82f6"; // Red for P1, Blue for P2
              } else if (hasP1Access) {
                lineColor = animationState === "p1" ? "#ef4444" : "#6b7280"; // Red when P1 active
              } else if (hasP2Access) {
                lineColor = animationState === "p2" ? "#3b82f6" : "#6b7280"; // Blue when P2 active
              } else {
                lineColor = "#3b82f6"; // Blue for active but no access
              }
            }

            return (
              <g key={line.id}>
                {/* Cache Line Background */}
                <rect
                  x={100}
                  y={yPos}
                  width={lineWidth}
                  height={wordSize}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isActiveLine ? "3" : "1"}
                  strokeDasharray={isActiveLine ? "5,5" : "none"}
                  rx="4"
                  className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
                />

                {/* Line Label */}
                <text
                  x={80}
                  y={yPos + wordSize / 2 + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                  fontWeight="bold"
                >
                  Line {lineIndex}
                </text>

                {/* Words in the cache line */}
                {line.words.map((word, wordIndex) => {
                  const xPos = 100 + wordIndex * wordSize;
                  const isAccessed = word.isP1Access || word.isP2Access;

                  return (
                    <g key={word.id}>
                      {/* Word cell */}
                      <rect
                        x={xPos + 2}
                        y={yPos + 2}
                        width={wordSize - 4}
                        height={wordSize - 4}
                        fill={isAccessed ? "#f59e0b" : "#f3f4f6"}
                        stroke="#9ca3af"
                        strokeWidth="1"
                        rx="2"
                      />

                      {/* Word index */}
                      <text
                        x={xPos + wordSize / 2}
                        y={yPos + wordSize / 2 - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                        fontWeight="bold"
                      >
                        {wordIndex}
                      </text>

                      {/* Variable label */}
                      {word.variable && (
                        <text
                          x={xPos + wordSize / 2}
                          y={yPos + wordSize / 2 + 8}
                          textAnchor="middle"
                          fontSize="12"
                          fill="white"
                          fontWeight="bold"
                        >
                          {word.variable}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Processor arrows and labels */}
                {hasP1Access && (
                  <g>
                    {/* P1 Label */}
                    <text
                      x={100 + config.p1WordIndex * wordSize + wordSize / 2}
                      y={yPos - 15}
                      textAnchor="middle"
                      fontSize="14"
                      fill={
                        scenario === "no-sharing"
                          ? "#6b7280"
                          : animationState === "p1"
                            ? "#ef4444"
                            : "#6b7280"
                      }
                      fontWeight="bold"
                      className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
                    >
                      P1
                    </text>
                    {/* P1 Arrow */}
                    <line
                      x1={100 + config.p1WordIndex * wordSize + wordSize / 2}
                      y1={yPos - 5}
                      x2={100 + config.p1WordIndex * wordSize + wordSize / 2}
                      y2={yPos + 2}
                      stroke={
                        scenario === "no-sharing"
                          ? "#6b7280"
                          : animationState === "p1"
                            ? "#ef4444"
                            : "#6b7280"
                      }
                      strokeWidth="2"
                      markerEnd="url(#arrowhead-down-p1)"
                      className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
                    />
                  </g>
                )}

                {hasP2Access && lineIndex === config.p2LineIndex && (
                  <g>
                    {/* P2 Label */}
                    <text
                      x={100 + config.p2WordIndex * wordSize + wordSize / 2}
                      y={yPos + wordSize + 25}
                      textAnchor="middle"
                      fontSize="14"
                      fill={
                        scenario === "no-sharing"
                          ? "#6b7280"
                          : animationState === "p2"
                            ? "#3b82f6"
                            : "#6b7280"
                      }
                      fontWeight="bold"
                      className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
                    >
                      P2
                    </text>
                    {/* P2 Arrow */}
                    <line
                      x1={100 + config.p2WordIndex * wordSize + wordSize / 2}
                      y1={yPos + wordSize + 15}
                      x2={100 + config.p2WordIndex * wordSize + wordSize / 2}
                      y2={yPos + wordSize - 2}
                      stroke={
                        scenario === "no-sharing"
                          ? "#6b7280"
                          : animationState === "p2"
                            ? "#3b82f6"
                            : "#6b7280"
                      }
                      strokeWidth="2"
                      markerEnd="url(#arrowhead-up-p2)"
                      className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Arrow markers */}
          <defs>
            <marker
              id="arrowhead-down-p1"
              markerWidth="10"
              markerHeight="7"
              refX="5"
              refY="6"
              orient="auto"
            >
              <polygon
                points="0 0, 10 0, 5 7"
                fill={
                  scenario === "no-sharing"
                    ? "#6b7280"
                    : animationState === "p1"
                      ? "#ef4444"
                      : "#6b7280"
                }
                className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
              />
            </marker>
            <marker
              id="arrowhead-up-p2"
              markerWidth="10"
              markerHeight="7"
              refX="5"
              refY="1"
              orient="auto"
            >
              <polygon
                points="0 7, 10 7, 5 0"
                fill={
                  scenario === "no-sharing"
                    ? "#6b7280"
                    : animationState === "p2"
                      ? "#3b82f6"
                      : "#6b7280"
                }
                className={scenario === "no-sharing" ? "" : "transition-all duration-500"}
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Legend and Configuration */}
      <div className="mb-6 flex justify-center gap-6">
        {/* Legend */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-center text-sm font-semibold text-gray-700">Legend</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-1 w-4 border border-gray-300 bg-transparent"
                style={{ borderStyle: "solid", borderWidth: "1px" }}
              ></div>
              <span className="text-gray-600">Cache Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-1 w-4 border-gray-500 bg-transparent"
                style={{ borderStyle: "dashed", borderWidth: "2px" }}
              ></div>
              <span className="text-gray-600">Active Cache Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-yellow-500"></div>
              <span className="text-gray-600">Processor Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-gray-300"></div>
              <span className="text-gray-600">Memory Word</span>
            </div>
            {scenario !== "no-sharing" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500"></div>
                  <span className="text-gray-600">P1 active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-blue-500"></div>
                  <span className="text-gray-600">P2 active</span>
                </div>
              </>
            )}
            {scenario === "no-sharing" && (
              <div className="flex items-center gap-2 col-span-2">
                <div className="h-3 w-3 rounded bg-gray-500"></div>
                <span className="text-gray-600">No coherence traffic</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Information */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-center text-sm font-semibold text-gray-700">Configuration</h4>
          <div className="space-y-1 text-xs">
            <div>
              <strong>Total Words:</strong> {metrics.totalWords} ({metrics.totalBytes} bytes)
            </div>
            <div>
              <strong>Organization:</strong> {metrics.totalLines} cache lines × {metrics.wordsPerLine} words/line
            </div>
            <div>
              <strong>Word Size:</strong> {metrics.bytesPerWord} bytes per word
            </div>
            <div>
              <strong>Line Size:</strong> {metrics.bytesPerLine} bytes per cache line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
