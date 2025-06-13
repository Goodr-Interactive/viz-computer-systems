import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer } from "recharts";
import { stageSizesConfig, latencyConfigUIEnabled, accessCountsUIEnabled } from "./Config";

const ACCESS_PATTERNS = {
  temporal: "temporal",
  spatial: "spatial",
  random: "random",
};

export const CacheHierarchyVisualization: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof ACCESS_PATTERNS>("temporal");
  const [latencyConfig, setLatencyConfig] = useState({
    l1: 1,
    l2: 10,
    l3: 30,
    ram: 300,
    hardDisk: 5000, // Added hard disk latency
  });
  const [amat, setAmat] = useState<number | null>(null);
  const [accessCounts, setAccessCounts] = useState({ l1: 0, l2: 0, l3: 0, ram: 0, hardDisk: 0 }); // Added hard disk to access counts
  const [isSimulating, setIsSimulating] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    firstAccessLatency: latencyConfig.hardDisk, // Initial latency for first access
    subsequentAccessLatency: latencyConfig.l1, // Reduced latency for subsequent accesses
    cacheMisses: 0, // Tracks the number of cache misses
  });

  const simulateAccessPattern = () => {
    const patternToLevelMap: Record<keyof typeof ACCESS_PATTERNS, keyof typeof latencyConfig> = {
      temporal: "l1",
      spatial: "l2",
      random: "hardDisk",
    };

    const level = patternToLevelMap[selectedPattern];
    const latency = latencyConfig[level];

    // Simulate hit/miss rates
    const hitRate = level === "hardDisk" ? 0 : 0.7; // Example: 70% hit rate for caches
    const missRate = 1 - hitRate;
    const missPenalty = latencyConfig.hardDisk; // Hard disk latency as miss penalty

    // Calculate AMAT
    const calculatedAmat = latency + missRate * missPenalty;
    setAmat(calculatedAmat);

    // Update access counts for all levels up to the hit level
    setAccessCounts((prev) => {
      const updatedCounts = { ...prev };
      const levels: Array<keyof typeof latencyConfig> = ["l1", "l2", "l3", "ram", "hardDisk"];
      for (const cacheLevel of levels) {
        updatedCounts[cacheLevel] += 1;
        if (cacheLevel === level) break; // Stop incrementing once the hit level is reached
      }
      return updatedCounts;
    });

    setCacheStats((prev) => ({
      ...prev,
      cacheMisses: prev.cacheMisses + (level === "hardDisk" ? 1 : 0),
    }));
  };

  const startSimulation = () => {
    setIsSimulating(true);
    const interval = setInterval(() => {
      simulateAccessPattern();
    }, 1000);

    return () => clearInterval(interval);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  const renderHierarchy = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <Card
          className={`text-center border-${stageSizesConfig.processorChip.borderStyle} border-${stageSizesConfig.processorChip.borderColor}`}
          style={{ width: `${stageSizesConfig.processorChip.width}px` }}
        >
          <CardContent>
            <div className="font-semibold">Processor Chip</div>
            <div className="flex items-center  justify-center space-x-4 mt-2">
              <Card
                className={`text-center border-${stageSizesConfig.cpu.borderStyle} border-${stageSizesConfig.cpu.borderColor}`}
                style={{ width: `${stageSizesConfig.cpu.width}px` }}
              >
                <CardContent>
                  <div className="font-semibold">CPU</div>
                </CardContent>
              </Card>
              <Card
                className={`text-center border-${stageSizesConfig.cache.borderStyle} border-${stageSizesConfig.cache.borderColor}`}
                style={{ width: `${stageSizesConfig.cache.width}px` }}
              >
                <CardContent>
                  <div className="font-semibold">Cache</div>
                  <div className="flex flex-col space-y-2 mt-2">
                    <Card
                      className={`text-center border-${stageSizesConfig.l1Cache.borderStyle} border-${stageSizesConfig.l1Cache.borderColor}`}
                    >
                      <CardContent>
                        <div className="font-semibold">L1</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`text-center border-${stageSizesConfig.l2Cache.borderStyle} border-${stageSizesConfig.l2Cache.borderColor}`}
                    >
                      <CardContent>
                        <div className="font-semibold">L2</div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`text-center border-${stageSizesConfig.l3Cache.borderStyle} border-${stageSizesConfig.l3Cache.borderColor}`}
                    >
                      <CardContent>
                        <div className="font-semibold">L3</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        <div className="w-12 h-0.5 bg-blue-500"></div>
        <Card
          className={`flex items-center justify-center text-center border-${stageSizesConfig.mainMemory.borderStyle} border-${stageSizesConfig.mainMemory.borderColor}`}
          style={{ width: `${stageSizesConfig.mainMemory.width}px`, height: `${stageSizesConfig.mainMemory.height}px` }}
        >
          <CardContent>
            <div className="font-semibold">Main Memory</div>
          </CardContent>
        </Card>
        <div className="w-12 h-0.5 bg-blue-500"></div>
        {stageSizesConfig.hardDisk && (
          <div
            style={{
              width: stageSizesConfig.hardDisk.width,
              height: stageSizesConfig.hardDisk.height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <path
                d="M2,50 A50,10 0 0,0 98,50 A50,10 0 0,0 2,50 L2,75 A50,10,0 0,0 98,75 L98,50"
                style={{ stroke: "#000000", fill: "none" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                color: "#000000",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Hard Drive
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-4">
      {Object.entries(latencyConfig).map(([level, latency]) => (
        <div key={level} className="flex items-center space-x-4">
          <div className="w-24 text-right font-semibold capitalize">{level}</div>
          <Slider
            value={[latency]}
            onValueChange={(value) =>
              setLatencyConfig((prev) => ({ ...prev, [level]: value[0] }))
            }
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
          {pattern}
        </Button>
      ))}
    </div>
  );

  const renderBarGraph = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={Object.entries(accessCounts).map(([level, count]) => ({ level, count }))}>
        <XAxis dataKey="level" />
        <YAxis />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderCacheStats = () => (
    <div className="mt-4 text-center">
      <h4 className="text-lg font-semibold">Statistics</h4>
      <p className="text-sm text-muted-foreground">
        First Access Latency: {cacheStats.firstAccessLatency} cycles
      </p>
      <p className="text-sm text-muted-foreground">
        Subsequent Access Latency: {cacheStats.subsequentAccessLatency} cycles
      </p>
      <p className="text-sm text-muted-foreground">
        Cache Misses: {cacheStats.cacheMisses}
      </p>
        <div className="mt-4 text-center">
          <h4 className="text-lg font-semibold">Memory Statistics</h4>
          <p className="text-sm text-muted-foreground">Average Memory Access Time (AMAT): {amat?.toFixed(2)} cycles</p>
          <p className="text-sm text-muted-foreground">Miss Rate: {(1 - cacheStats.subsequentAccessLatency / cacheStats.firstAccessLatency).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Hit Rate: {(cacheStats.subsequentAccessLatency / cacheStats.firstAccessLatency).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Cache Misses: {cacheStats.cacheMisses}</p>
        </div>
    </div>
    
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cache Hierarchy Visualization</CardTitle>
        </CardHeader>
        <CardContent>{renderHierarchy()}</CardContent>
      </Card>

      {latencyConfigUIEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Latency Configuration</CardTitle>
          </CardHeader>
          <CardContent>{renderConfiguration()}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Access Pattern Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          {renderAccessPattern()}
          <div className="flex space-x-4 mt-4">
            <Button onClick={startSimulation} disabled={isSimulating}>
              Start Simulation
            </Button>
            <Button onClick={stopSimulation} disabled={!isSimulating}>
              Stop Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {accessCountsUIEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Access Counts</CardTitle>
          </CardHeader>
          <CardContent>{renderBarGraph()}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
        </CardHeader>
        <CardContent>{renderCacheStats()}</CardContent>
      </Card>
    </div>
  );
};
