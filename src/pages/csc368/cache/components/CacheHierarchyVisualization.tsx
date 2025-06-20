import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer, Legend } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { stageSizesConfig, latencyConfigUIEnabled, accessCountsUIEnabled } from "./Config";

const ACCESS_PATTERNS = {
  temporal: "temporal",
  spatial: "spatial",
  noLocality: "noLocality",
};

const STAGE_EXPLANATIONS = {
  cpu: {
    title: "Central Processing Unit (CPU)",
    description:
      "The CPU is the brain of the computer that executes instructions. When the CPU needs data, it first checks the cache hierarchy. The CPU operates at very high speeds and expects data to be available quickly. Any delay in data access directly impacts performance.",
  },
  l1: {
    title: "L1 Cache",
    description:
      "L1 (Level 1) cache is the fastest and smallest cache, located directly on the CPU chip. It's split into instruction cache (I-cache) and data cache (D-cache). L1 cache has the lowest latency (typically 1-4 cycles) but limited capacity (usually 16-64 KB per core).",
  },
  l2: {
    title: "L2 Cache (Shared)",
    description:
      "L2 (Level 2) cache is larger than L1 but slower. It's a shared cache among CPU cores, serving as a buffer between L1 and main memory. L2 cache typically has 256KB-8MB capacity with latency around 10-20 cycles. It stores recently accessed data that didn't fit in L1 and allows cores to share data efficiently.",
  },
  ram: {
    title: "Main Memory (RAM)",
    description:
      "Random Access Memory (RAM) is the primary storage for active programs and data. It's much larger than cache (gigabytes) but significantly slower (200-400 cycles latency). When data isn't found in any cache level, it must be fetched from RAM.",
  },
};

export const CacheHierarchyVisualization: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof ACCESS_PATTERNS>("temporal");
  const [latencyConfig, setLatencyConfig] = useState({
    l1: 1,
    l2: 10,
    ram: 300,
  });
  const [amat, setAmat] = useState<number | null>(null);
  const [accessCounts, setAccessCounts] = useState({ l1: 0, l2: 0, ram: 0 }); // Total accesses to each level
  const [hitMissData, setHitMissData] = useState({
    l1: { hits: 0, misses: 0 },
    l2: { hits: 0, misses: 0 },
    ram: { hits: 0, misses: 0 },
  }); // Hit/miss breakdown for stacked bar chart
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentAccessLevel, setCurrentAccessLevel] = useState<keyof typeof latencyConfig | null>(
    null
  );

  // Use ref to track current access count synchronously
  const currentAccessCount = useRef(0);

  // State to track which stages should be highlighted during access
  const [highlightedStages, setHighlightedStages] = useState<Set<string>>(new Set());

  const [cacheStats, setCacheStats] = useState({
    subsequentAccessLatency: latencyConfig.l1, // Reduced latency for subsequent accesses
    cacheMisses: 0, // Tracks the number of cache misses
    totalAccesses: 0, // Total number of access simulations
    cacheHits: 0, // Total number of cache hits (L1 or L2, not RAM)
    totalLatency: 0, // Cumulative latency across all accesses
  });

  // Deterministic hit level sequences for each access pattern
  const DETERMINISTIC_HIT_LEVELS: Record<
    keyof typeof ACCESS_PATTERNS,
    Array<keyof typeof latencyConfig>
  > = {
    temporal: ["ram", "l1", "l1", "l1", "l1", "l1", "l1", "l1", "l2", "l1"], // mostly L1 hits (70%), some L2 (20%), rare RAM (10%)
    spatial: ["ram", "l1", "l2", "l1", "l2", "l1", "l2", "l1", "l2", "ram"], // mix of L1/L2 (40% each), some RAM (20%)
    noLocality: ["ram", "ram", "ram", "ram", "ram", "ram", "ram", "ram", "ram", "ram"], // mostly RAM (70%), some L2 (10%), rare L1 (20%)
  };

  // DEBUG: Log the deterministic patterns
  console.log("DETERMINISTIC_HIT_LEVELS:", DETERMINISTIC_HIT_LEVELS);

  // Reset simulation when access pattern changes to avoid stale data
  useEffect(() => {
    resetSimulation();

    // Immediately calculate AMAT for the new pattern
    const hitLevels = DETERMINISTIC_HIT_LEVELS[selectedPattern];
    const hitCounts = { l1: 0, l2: 0, ram: 0 };
    hitLevels.forEach((level) => {
      hitCounts[level]++;
    });

    const totalPatternHits = hitLevels.length;
    const l1HitRate = hitCounts.l1 / totalPatternHits;
    const l2HitRate = hitCounts.l2 / totalPatternHits;
    const ramHitRate = hitCounts.ram / totalPatternHits;

    const l1MissRate = 1 - l1HitRate;
    const l2MissRate = l2HitRate > 0 ? ramHitRate / (l2HitRate + ramHitRate) : 1;

    const calculatedAmat =
      latencyConfig.l1 + l1MissRate * (latencyConfig.l2 + l2MissRate * latencyConfig.ram);

    setAmat(calculatedAmat);
  }, [selectedPattern, latencyConfig]);

  const simulateAccessPattern = () => {
    // Use deterministic hit level based on selected pattern and current access count (using ref for synchronous updates)
    const levels: Array<keyof typeof latencyConfig> = ["l1", "l2", "ram"];
    const hitLevels = DETERMINISTIC_HIT_LEVELS[selectedPattern];
    const hitLevel = hitLevels[currentAccessCount.current % hitLevels.length];

    // DEBUG: Console logging
    console.log("=== SIMULATION DEBUG ===");
    console.log("Selected Pattern:", selectedPattern);
    console.log("Hit Levels Array:", hitLevels);
    console.log("Current Access Count (from ref):", currentAccessCount.current);
    console.log("Total Accesses (from state):", cacheStats.totalAccesses);
    console.log(
      "Index (currentAccessCount % hitLevels.length):",
      currentAccessCount.current % hitLevels.length
    );
    console.log("Hit Level for this access:", hitLevel);

    // Set highlighted stages based on the access level
    const stagesToHighlight = new Set<string>();
    stagesToHighlight.add("cpu"); // CPU is always accessed first

    if (hitLevel === "l1") {
      stagesToHighlight.add("l1");
    } else if (hitLevel === "l2") {
      stagesToHighlight.add("l1"); // L1 is checked first
      stagesToHighlight.add("l2");
    } else if (hitLevel === "ram") {
      stagesToHighlight.add("l1"); // L1 is checked first
      stagesToHighlight.add("l2"); // L2 is checked second
      stagesToHighlight.add("ram"); // Finally RAM
    }

    setHighlightedStages(stagesToHighlight);
    setCurrentAccessLevel(hitLevel);

    // Clear highlights after a brief delay to show the access path
    setTimeout(() => {
      setHighlightedStages(new Set());
    }, 800);

    let totalLatency = 0;
    let accessCount = 0;

    // Simulate cache hierarchy access - check each level sequentially
    for (const level of levels) {
      accessCount++;
      totalLatency += latencyConfig[level];
      console.log(`Checking level ${level}, total latency so far: ${totalLatency}`);
      if (level === hitLevel) {
        console.log(`HIT at level ${level}! Breaking out of loop.`);
        break;
      }
      console.log(`MISS at level ${level}, continuing to next level...`);
    }

    // Increment the access count synchronously
    currentAccessCount.current += 1;

    // Calculate AMAT based on the overall pattern statistics, not just this single access
    const hitCounts = { l1: 0, l2: 0, ram: 0 };
    hitLevels.forEach((level) => {
      hitCounts[level]++;
    });

    const totalPatternHits = hitLevels.length;
    const l1HitRate = hitCounts.l1 / totalPatternHits;
    const l2HitRate = hitCounts.l2 / totalPatternHits;
    const ramHitRate = hitCounts.ram / totalPatternHits;

    console.log("Hit Counts:", hitCounts);
    console.log("Hit Rates - L1:", l1HitRate, "L2:", l2HitRate, "RAM:", ramHitRate);

    // AMAT = L1_latency + L1_miss_rate * (L2_latency + L2_miss_rate * RAM_latency)
    const l1MissRate = 1 - l1HitRate;
    const l2MissRate = l2HitRate > 0 ? ramHitRate / (l2HitRate + ramHitRate) : 1;

    let calculatedAmat =
      latencyConfig.l1 + l1MissRate * (latencyConfig.l2 + l2MissRate * latencyConfig.ram);

    console.log("Calculated AMAT:", calculatedAmat);
    setAmat(calculatedAmat);

    // Count cache misses more accurately - any access that doesn't hit L1 is an L1 miss
    const isL1Miss = hitLevel !== "l1";
    const isCacheHit = hitLevel === "l1" || hitLevel === "l2"; // Cache hit if it hits L1 or L2
    console.log("Is L1 Miss:", isL1Miss);
    console.log("Is Cache Hit:", isCacheHit);
    console.log("Total latency for this access:", totalLatency);

    // Update cache stats (now using the ref value for totalAccesses)
    setCacheStats((prev) => ({
      ...prev,
      subsequentAccessLatency: totalLatency, // Use the cumulative latency, not just the hit level latency
      cacheMisses: prev.cacheMisses + (isL1Miss ? 1 : 0),
      totalAccesses: currentAccessCount.current, // Use the ref value
      cacheHits: prev.cacheHits + (isCacheHit ? 1 : 0), // Only L1 or L2 hits count as cache hits
      totalLatency: prev.totalLatency + totalLatency, // Add this access's latency to total
    }));

    // Update access counts and hit/miss data based on actual simulation
    setAccessCounts((prev) => {
      const updatedCounts = { ...prev };
      for (let i = 0; i < accessCount; i++) {
        updatedCounts[levels[i]] += 1;
      }
      console.log("Updated access counts:", updatedCounts);
      return updatedCounts;
    });

    // Update hit/miss data for stacked bar chart
    setHitMissData((prev) => {
      const updated = { ...prev };

      // For each level accessed before hitting
      for (let i = 0; i < accessCount; i++) {
        const level = levels[i];
        if (level === hitLevel) {
          // This level had a hit
          updated[level] = {
            ...updated[level],
            hits: updated[level].hits + 1,
          };
        } else {
          // This level had a miss
          updated[level] = {
            ...updated[level],
            misses: updated[level].misses + 1,
          };
        }
      }

      console.log("Updated hit/miss data:", updated);
      return updated;
    });

    console.log("=== END DEBUG ===\n");
  };

  const startSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    setIsSimulating(true);
    const interval = setInterval(() => {
      simulateAccessPattern();
    }, 1000);

    setSimulationInterval(interval);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }

    // Reset the ref counter
    currentAccessCount.current = 0;

    // Reset all state to initial values
    setAmat(null);
    setAccessCounts({ l1: 0, l2: 0, ram: 0 });
    setHitMissData({
      l1: { hits: 0, misses: 0 },
      l2: { hits: 0, misses: 0 },
      ram: { hits: 0, misses: 0 },
    });
    setCacheStats({
      subsequentAccessLatency: latencyConfig.l1,
      cacheMisses: 0,
      totalAccesses: 0,
      cacheHits: 0,
      totalLatency: 0,
    });
    setCurrentAccessLevel(null);
    setHighlightedStages(new Set());
  };

  const renderHierarchy = () => (
    <TooltipProvider>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <Card
            className={`text-center border-${stageSizesConfig.processorChip.borderStyle} border-${stageSizesConfig.processorChip.borderColor}`}
            style={{ width: `${stageSizesConfig.processorChip.width}px` }}
          >
            <CardContent className="py-2">
              <div className="text-sm font-semibold">Processor Chip</div>
              <div className="mt-1 flex items-center justify-center space-x-1">
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Card
                          className={`flex items-center justify-center text-center border-${stageSizesConfig.cpu.borderStyle} border-${stageSizesConfig.cpu.borderColor} cursor-pointer transition-colors ${
                            highlightedStages.has("cpu")
                              ? "border-yellow-500 bg-yellow-200 shadow-lg"
                              : "hover:bg-gray-100"
                          }`}
                          style={{
                            width: `${stageSizesConfig.cpu.width}px`,
                            height: `${stageSizesConfig.cpu.height}px`,
                          }}
                        >
                          <CardContent className="flex items-center justify-center p-1">
                            <div className="text-xs font-semibold">CPU</div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to learn more about the CPU</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{STAGE_EXPLANATIONS.cpu.title}</DialogTitle>
                    </DialogHeader>
                    <p>{STAGE_EXPLANATIONS.cpu.description}</p>
                  </DialogContent>
                </Dialog>
                <div className="h-0.5 w-1 bg-blue-500"></div>
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Card
                          className={`flex items-center justify-center text-center border-${stageSizesConfig.l1Cache.borderStyle} border-${stageSizesConfig.l1Cache.borderColor} cursor-pointer transition-colors ${
                            highlightedStages.has("l1")
                              ? "border-yellow-500 bg-yellow-200 shadow-lg"
                              : "hover:bg-gray-100"
                          }`}
                          style={{
                            width: `${stageSizesConfig.l1Cache.width}px`,
                            height: `${stageSizesConfig.l1Cache.height}px`,
                          }}
                        >
                          <CardContent className="flex items-center justify-center p-1">
                            <div className="text-xs font-semibold">L1</div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to learn more about L1 Cache</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{STAGE_EXPLANATIONS.l1.title}</DialogTitle>
                    </DialogHeader>
                    <p>{STAGE_EXPLANATIONS.l1.description}</p>
                  </DialogContent>
                </Dialog>
                <div className="h-0.5 w-2 bg-blue-500"></div>
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Card
                          className={`flex items-center justify-center text-center border-${stageSizesConfig.l2Cache.borderStyle} border-${stageSizesConfig.l2Cache.borderColor} cursor-pointer transition-colors ${
                            highlightedStages.has("l2")
                              ? "border-yellow-500 bg-yellow-200 shadow-lg"
                              : "hover:bg-gray-100"
                          }`}
                          style={{
                            width: `${stageSizesConfig.l2Cache.width}px`,
                            height: `${stageSizesConfig.l2Cache.height}px`,
                          }}
                        >
                          <CardContent className="flex items-center justify-center p-1">
                            <div className="text-xs font-semibold">L2</div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to learn more about L2 Shared Cache</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{STAGE_EXPLANATIONS.l2.title}</DialogTitle>
                    </DialogHeader>
                    <p>{STAGE_EXPLANATIONS.l2.description}</p>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          <div className="h-0.5 w-6 bg-blue-500"></div>
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Card
                    className={`flex items-center justify-center text-center border-${stageSizesConfig.mainMemory.borderStyle} border-${stageSizesConfig.mainMemory.borderColor} cursor-pointer transition-colors ${
                      highlightedStages.has("ram")
                        ? "border-yellow-500 bg-yellow-200 shadow-lg"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      width: `${stageSizesConfig.mainMemory.width}px`,
                      height: `${stageSizesConfig.mainMemory.height}px`,
                    }}
                  >
                    <CardContent className="flex items-center justify-center p-2">
                      <div className="text-sm font-semibold">Main Memory</div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to learn more about Main Memory (RAM)</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{STAGE_EXPLANATIONS.ram.title}</DialogTitle>
              </DialogHeader>
              <p>{STAGE_EXPLANATIONS.ram.description}</p>
            </DialogContent>
          </Dialog>{" "}
        </div>
      </div>
    </TooltipProvider>
  );

  const renderConfiguration = () => (
    <div className="space-y-4">
      {Object.entries(latencyConfig).map(([level, latency]) => (
        <div key={level} className="flex items-center space-x-4">
          <div className="w-24 text-right font-semibold capitalize">{level}</div>
          <Slider
            value={[latency]}
            onValueChange={(value) => setLatencyConfig((prev) => ({ ...prev, [level]: value[0] }))}
            max={500}
            min={1}
            step={1}
            className="flex-1"
          />
          <div className="w-12 text-center">{latency} cycles</div>
        </div>
      ))}
    </div>
  );

  const renderAccessPattern = () => (
    <div className="flex space-x-4">
      {Object.keys(ACCESS_PATTERNS).map((pattern) => (
        <Button
          key={pattern}
          variant={selectedPattern === pattern ? "default" : "outline"}
          onClick={() => setSelectedPattern(pattern as keyof typeof ACCESS_PATTERNS)}
          className="flex-1"
        >
          {pattern === "temporal"
            ? "Temporal Locality"
            : pattern === "spatial"
              ? "Spatial Locality"
              : pattern === "noLocality"
                ? "No Locality"
                : pattern}
        </Button>
      ))}
    </div>
  );

  const renderBarGraph = () => {
    // Transform hit/miss data for stacked bar chart
    const chartData = Object.entries(hitMissData).map(([level, data]) => ({
      level: level.toUpperCase(),
      hits: data.hits,
      misses: data.misses,
      total: data.hits + data.misses,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="level" />
          <YAxis domain={[0, 10]} />
          <Legend />
          <Bar dataKey="hits" stackId="a" fill="#22c55e" name="Hits" />
          <Bar dataKey="misses" stackId="a" fill="#ef4444" name="Misses" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCacheStats = () => {
    // Calculate actual hit rates from the deterministic pattern
    const hitLevels = DETERMINISTIC_HIT_LEVELS[selectedPattern];
    const totalHits = hitLevels.length;
    const hitCounts = { l1: 0, l2: 0, ram: 0 };

    // Count hits at each level in the deterministic pattern
    hitLevels.forEach((level) => {
      hitCounts[level]++;
    });

    // Calculate average latency
    const averageLatency =
      cacheStats.totalAccesses > 0
        ? (cacheStats.totalLatency / cacheStats.totalAccesses).toFixed(2)
        : "0.00";

    return (
      <div className="space-y-4">
        {/* Main Statistics */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">Total Accesses</span>
            <span className="text-lg font-semibold">{cacheStats.totalAccesses}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">Cache Hits (L1/L2)</span>
            <span className="text-lg font-semibold text-green-600">{cacheStats.cacheHits}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">Cache Misses (L1)</span>
            <span className="text-lg font-semibold text-red-600">{cacheStats.cacheMisses}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">RAM Accesses</span>
            <span className="text-lg font-semibold text-orange-600">
              {cacheStats.totalAccesses - cacheStats.cacheHits}
            </span>
          </div>
        </div>

        {/* Latency Statistics */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 gap-2 text-center">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total Latency:</span>
              <span className="text-sm font-medium">{cacheStats.totalLatency} cycles</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Average Latency:</span>
              <span className="text-sm font-medium">{averageLatency} cycles/access</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Last Access Latency:</span>
              <span className="text-sm font-medium">
                {cacheStats.subsequentAccessLatency} cycles
              </span>
            </div>
            {amat !== null && (
              <div className="flex items-center justify-between rounded bg-blue-50 px-2 py-1">
                <span className="text-sm font-medium text-blue-700">AMAT:</span>
                <span className="text-sm font-semibold text-blue-700">
                  {amat.toFixed(2)} cycles
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pattern Distribution */}
        <div className="border-t pt-4">
          <h5 className="mb-3 text-center text-sm font-semibold">
            Current Pattern (
            {selectedPattern === "temporal"
              ? "Temporal"
              : selectedPattern === "spatial"
                ? "Spatial"
                : "No Locality"}
            ) Hit Distribution
          </h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(hitCounts).map(([level, count]) => {
              const hitRate = (count / totalHits) * 100;
              return (
                <div key={level} className="flex flex-col rounded bg-gray-50 px-2 py-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {level.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{hitRate.toFixed(1)}%</span>
                  <span className="text-muted-foreground text-xs">
                    ({count}/{totalHits})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cache Hierarchy Visualization</CardTitle>
          </CardHeader>
          <CardContent>{renderHierarchy()}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Pattern Examples</CardTitle>
          </CardHeader>
          <CardContent>
            {renderAccessPattern()}
            <div className="mt-4 flex space-x-4">
              <Button onClick={startSimulation} disabled={isSimulating}>
                Start Example
              </Button>
              <Button onClick={stopSimulation} disabled={!isSimulating}>
                Stop Example
              </Button>
              <Button onClick={resetSimulation} variant="outline">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {latencyConfigUIEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Latency Configuration</CardTitle>
          </CardHeader>
          <CardContent>{renderConfiguration()}</CardContent>
        </Card>
      )}

      {accessCountsUIEnabled && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hit/Miss Breakdown</CardTitle>
            </CardHeader>
            <CardContent>{renderBarGraph()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>{renderCacheStats()}</CardContent>
          </Card>
        </div>
      )}

      {!accessCountsUIEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>{renderCacheStats()}</CardContent>
        </Card>
      )}
    </div>
  );
};
