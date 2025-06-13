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
    totalAccesses: 0, // Total number of access simulations
    startupCycles: 0, // Tracks startup overhead cycles
  });

  const simulateAccessPattern = () => {
    // Define miss rates based on access pattern and cache level
    const missRates = {
      temporal: { l1: 0.1, l2: 0.2, l3: 0.3, ram: 0.8, hardDisk: 1.0 },
      spatial: { l1: 0.3, l2: 0.15, l3: 0.25, ram: 0.7, hardDisk: 1.0 },
      random: { l1: 0.8, l2: 0.85, l3: 0.9, ram: 0.95, hardDisk: 1.0 }
    };

    // Startup cost: On first access, we need to reach hard disk for initial loading
    const STARTUP_CYCLES = 10;
    let isFirstAccess = false;
    
    setCacheStats(prev => {
      if (prev.totalAccesses === 0) {
        isFirstAccess = true;
      }
      return prev;
    });

    // Simulate cache hierarchy access - check each level sequentially
    const levels: Array<keyof typeof latencyConfig> = ["l1", "l2", "l3", "ram", "hardDisk"];
    let totalLatency = 0;
    let hitLevel: keyof typeof latencyConfig | null = null;
    let accessCount = 0;

    // Add startup latency if this is the first access in the simulation
    if (isFirstAccess) {
      totalLatency += STARTUP_CYCLES;
    }

    for (const level of levels) {
      accessCount++;
      const missRate = missRates[selectedPattern][level];
      const hitRate = 1 - missRate;
      
      // Add latency for accessing this level
      totalLatency += latencyConfig[level];
      
      // Probabilistically determine if we hit at this level using hitRate
      const random = Math.random();
      if (random < hitRate || level === "hardDisk") {
        // Hit at this level (or reached final level)
        hitLevel = level;
        break;
      }
      // If miss (random >= hitRate), continue to next level
    }

    // Calculate proper AMAT based on the cache hierarchy (including startup cost)
    let calculatedAmat = 0;
    
    // Add startup cost to AMAT calculation
    calculatedAmat += STARTUP_CYCLES;
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      if (i === 0) {
        // L1 is always accessed
        calculatedAmat += latencyConfig[level];
      } else {
        // Higher levels are accessed only on miss from previous levels
        let missFromPrevious = 1;
        for (let j = 0; j < i; j++) {
          missFromPrevious *= missRates[selectedPattern][levels[j]];
        }
        calculatedAmat += missFromPrevious * latencyConfig[level];
      }
    }
    
    setAmat(calculatedAmat);

    // Update cache stats
    setCacheStats((prev) => ({
      ...prev,
      firstAccessLatency: totalLatency,
      subsequentAccessLatency: hitLevel ? latencyConfig[hitLevel] : latencyConfig.hardDisk,
      cacheMisses: prev.cacheMisses + (hitLevel === "ram" || hitLevel === "hardDisk" ? 1 : 0),
      totalAccesses: prev.totalAccesses + 1,
      startupCycles: prev.startupCycles + (isFirstAccess ? STARTUP_CYCLES : 0),
    }));

    // Update access counts based on actual simulation
    setAccessCounts((prev) => {
      const updatedCounts = { ...prev };
      for (let i = 0; i < accessCount; i++) {
        updatedCounts[levels[i]] += 1;
      }
      return updatedCounts;
    });
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

  const resetSimulation = () => {
    setIsSimulating(false);
    setAmat(null);
    setAccessCounts({ l1: 0, l2: 0, l3: 0, ram: 0, hardDisk: 0 });
    setCacheStats({
      firstAccessLatency: latencyConfig.hardDisk,
      subsequentAccessLatency: latencyConfig.l1,
      cacheMisses: 0,
      totalAccesses: 0,
      startupCycles: 0,
    });
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

  const renderCacheStats = () => {
    // Define miss rates based on access pattern and cache level
    const missRates = {
      temporal: { l1: 0.1, l2: 0.2, l3: 0.3, ram: 0.8, hardDisk: 1.0 },
      spatial: { l1: 0.3, l2: 0.15, l3: 0.25, ram: 0.7, hardDisk: 1.0 },
      random: { l1: 0.8, l2: 0.85, l3: 0.9, ram: 0.95, hardDisk: 1.0 }
    };

    return (
      <div className="mt-4 text-center">
        <h4 className="text-lg font-semibold">Statistics</h4>
        <p className="text-sm text-muted-foreground">
          Total Accesses: {cacheStats.totalAccesses}
        </p>
        <p className="text-sm text-muted-foreground">
          Startup Cycles Used: {cacheStats.startupCycles}
        </p>
        <p className="text-sm text-muted-foreground">
          First Access Latency: {cacheStats.firstAccessLatency} cycles
        </p>
        <p className="text-sm text-muted-foreground">
          Subsequent Access Latency: {cacheStats.subsequentAccessLatency} cycles
        </p>
        <p className="text-sm text-muted-foreground">
          Cache Misses: {cacheStats.cacheMisses}
        </p>
        <div className="mt-2">
          <h5 className="font-semibold text-sm">Current Pattern ({selectedPattern}) Hit Rates:</h5>
          {Object.entries(missRates[selectedPattern]).map(([level, missRate]) => {
            const hitRate = 1 - missRate;
            return (
              <p key={level} className="text-sm text-muted-foreground">
                {level.toUpperCase()}: {(hitRate * 100).toFixed(1)}% hit rate
              </p>
            );
          })}
        </div>
      </div>
    );
  };

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
          <CardTitle>Access Pattern Examples</CardTitle>
        </CardHeader>
        <CardContent>
          {renderAccessPattern()}
          <div className="flex space-x-4 mt-4">
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

      {amat !== null && (
        <div className="mt-4 text-center">
          <h4 className="text-lg font-semibold">Memory Statistics</h4>
          <p className="text-sm text-muted-foreground">Average Memory Access Time (AMAT): {amat.toFixed(2)} cycles</p>
        </div>
      )}
    </div>
  );
};
