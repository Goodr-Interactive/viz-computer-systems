import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CacheConfig {
  enabled: boolean;
  size: number;
  blockSize: number;
  associativity: number;
  accessTime: number;
}

interface CacheHierarchyConfig {
  l1: CacheConfig;
  l2: CacheConfig;
  l3: CacheConfig;
  ramAccessTime: number;
}

interface WorkloadTesterProps {
  config: CacheHierarchyConfig;
}

interface MemoryAccess {
  address: number;
  type: 'read' | 'write';
  id: number;
}

interface AccessResult {
  address: number;
  type: 'read' | 'write';
  hitLevel: 'l1' | 'l2' | 'l3' | 'ram';
  latency: number;
  id: number;
}

// Predefined workloads
const WORKLOADS = {
  sequential: {
    name: "Sequential Access",
    description: "Accesses consecutive memory addresses",
    generate: (count: number): MemoryAccess[] => {
      const accesses: MemoryAccess[] = [];
      const baseAddress = 0x1000;
      for (let i = 0; i < count; i++) {
        accesses.push({
          address: baseAddress + (i * 4), // 4-byte integers
          type: 'read',
          id: i
        });
      }
      return accesses;
    }
  },
  strided: {
    name: "Strided Access",
    description: "Accesses memory with a fixed stride",
    generate: (count: number): MemoryAccess[] => {
      const accesses: MemoryAccess[] = [];
      const baseAddress = 0x1000;
      const stride = 256; // Skip 256 bytes each time
      for (let i = 0; i < count; i++) {
        accesses.push({
          address: baseAddress + (i * stride),
          type: 'read',
          id: i
        });
      }
      return accesses;
    }
  },
  random: {
    name: "Random Access",
    description: "Random memory accesses within a range",
    generate: (count: number): MemoryAccess[] => {
      const accesses: MemoryAccess[] = [];
      const baseAddress = 0x1000;
      const range = 0x10000; // 64KB range
      for (let i = 0; i < count; i++) {
        accesses.push({
          address: baseAddress + Math.floor(Math.random() * range),
          type: Math.random() > 0.8 ? 'write' : 'read',
          id: i
        });
      }
      return accesses;
    }
  },
  locality: {
    name: "Temporal Locality",
    description: "Repeatedly accesses the same small set of addresses",
    generate: (count: number): MemoryAccess[] => {
      const accesses: MemoryAccess[] = [];
      const hotAddresses = [0x1000, 0x1100, 0x1200, 0x1300, 0x1400];
      for (let i = 0; i < count; i++) {
        const address = hotAddresses[i % hotAddresses.length];
        accesses.push({
          address,
          type: 'read',
          id: i
        });
      }
      return accesses;
    }
  }
};

export const WorkloadTester: React.FC<WorkloadTesterProps> = ({ config }) => {
  const [selectedWorkload, setSelectedWorkload] = useState("sequential");
  const [accessCount, setAccessCount] = useState(100);
  const [results, setResults] = useState<AccessResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAccess, setCurrentAccess] = useState(0);

  // Simulate cache state (simplified - just track recent addresses)
  const [cacheState, setCacheState] = useState<{
    l1: Set<number>;
    l2: Set<number>;
    l3: Set<number>;
  }>({
    l1: new Set(),
    l2: new Set(),
    l3: new Set()
  });

  const getBlockAddress = (address: number, blockSize: number) => {
    return Math.floor(address / blockSize) * blockSize;
  };

  const simulateAccess = (access: MemoryAccess): AccessResult => {
    const blockAddress = getBlockAddress(access.address, config.l1.blockSize);
    
    // Check L1 cache
    if (config.l1.enabled && cacheState.l1.has(blockAddress)) {
      return {
        ...access,
        hitLevel: 'l1',
        latency: config.l1.accessTime
      };
    }
    
    // Check L2 cache
    if (config.l2.enabled && cacheState.l2.has(blockAddress)) {
      // Add to L1 cache (simulate cache fill)
      if (config.l1.enabled) {
        const newL1 = new Set(cacheState.l1);
        newL1.add(blockAddress);
        // Simple eviction: keep only recent blocks (limit cache size)
        const maxL1Blocks = (config.l1.size * 1024) / config.l1.blockSize;
        if (newL1.size > maxL1Blocks) {
          const oldestBlock = newL1.values().next().value;
          if (oldestBlock !== undefined) {
            newL1.delete(oldestBlock);
          }
        }
        setCacheState(prev => ({ ...prev, l1: newL1 }));
      }
      
      return {
        ...access,
        hitLevel: 'l2',
        latency: config.l2.accessTime
      };
    }
    
    // Check L3 cache
    if (config.l3.enabled && cacheState.l3.has(blockAddress)) {
      // Add to L2 and L1 caches
      if (config.l2.enabled) {
        const newL2 = new Set(cacheState.l2);
        newL2.add(blockAddress);
        const maxL2Blocks = (config.l2.size * 1024) / config.l2.blockSize;
        if (newL2.size > maxL2Blocks) {
          const oldestBlock = newL2.values().next().value;
          if (oldestBlock !== undefined) {
            newL2.delete(oldestBlock);
          }
        }
        setCacheState(prev => ({ ...prev, l2: newL2 }));
      }
      
      if (config.l1.enabled) {
        const newL1 = new Set(cacheState.l1);
        newL1.add(blockAddress);
        const maxL1Blocks = (config.l1.size * 1024) / config.l1.blockSize;
        if (newL1.size > maxL1Blocks) {
          const oldestBlock = newL1.values().next().value;
          if (oldestBlock !== undefined) {
            newL1.delete(oldestBlock);
          }
        }
        setCacheState(prev => ({ ...prev, l1: newL1 }));
      }
      
      return {
        ...access,
        hitLevel: 'l3',
        latency: config.l3.accessTime
      };
    }
    
    // RAM access - load into all enabled caches
    setCacheState(prev => {
      const newState = { ...prev };
      
      if (config.l3.enabled) {
        newState.l3 = new Set(prev.l3);
        newState.l3.add(blockAddress);
        const maxL3Blocks = (config.l3.size * 1024) / config.l3.blockSize;
        if (newState.l3.size > maxL3Blocks) {
          const oldestBlock = newState.l3.values().next().value;
          if (oldestBlock !== undefined) {
            newState.l3.delete(oldestBlock);
          }
        }
      }
      
      if (config.l2.enabled) {
        newState.l2 = new Set(prev.l2);
        newState.l2.add(blockAddress);
        const maxL2Blocks = (config.l2.size * 1024) / config.l2.blockSize;
        if (newState.l2.size > maxL2Blocks) {
          const oldestBlock = newState.l2.values().next().value;
          if (oldestBlock !== undefined) {
            newState.l2.delete(oldestBlock);
          }
        }
      }
      
      if (config.l1.enabled) {
        newState.l1 = new Set(prev.l1);
        newState.l1.add(blockAddress);
        const maxL1Blocks = (config.l1.size * 1024) / config.l1.blockSize;
        if (newState.l1.size > maxL1Blocks) {
          const oldestBlock = newState.l1.values().next().value;
          if (oldestBlock !== undefined) {
            newState.l1.delete(oldestBlock);
          }
        }
      }
      
      return newState;
    });
    
    return {
      ...access,
      hitLevel: 'ram',
      latency: config.ramAccessTime
    };
  };

  const runWorkload = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentAccess(0);
    
    // Reset cache state
    setCacheState({ l1: new Set(), l2: new Set(), l3: new Set() });
    
    const workload = WORKLOADS[selectedWorkload as keyof typeof WORKLOADS];
    const accesses = workload.generate(accessCount);
    const newResults: AccessResult[] = [];
    
    for (let i = 0; i < accesses.length; i++) {
      setCurrentAccess(i + 1);
      const result = simulateAccess(accesses[i]);
      newResults.push(result);
      setResults([...newResults]);
      
      // Add small delay for animation
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsRunning(false);
  };

  const calculateStats = () => {
    if (results.length === 0) return null;
    
    const hitCounts = {
      l1: results.filter(r => r.hitLevel === 'l1').length,
      l2: results.filter(r => r.hitLevel === 'l2').length,
      l3: results.filter(r => r.hitLevel === 'l3').length,
      ram: results.filter(r => r.hitLevel === 'ram').length
    };
    
    const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
    const avgLatency = totalLatency / results.length;
    
    const hitRates = {
      l1: hitCounts.l1 / results.length,
      l2: hitCounts.l2 / results.length,
      l3: hitCounts.l3 / results.length,
      overall: (hitCounts.l1 + hitCounts.l2 + hitCounts.l3) / results.length
    };
    
    return { hitCounts, hitRates, avgLatency, totalLatency };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Memory Access Workload Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Workload Type</label>
              <Select value={selectedWorkload} onValueChange={setSelectedWorkload}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKLOADS).map(([key, workload]) => (
                    <SelectItem key={key} value={key}>
                      {workload.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {WORKLOADS[selectedWorkload as keyof typeof WORKLOADS].description}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Number of Accesses</label>
              <Select value={accessCount.toString()} onValueChange={(value) => setAccessCount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={runWorkload} disabled={isRunning} className="w-full">
            {isRunning ? `Running... (${currentAccess}/${accessCount})` : 'Run Workload'}
          </Button>
          
          {isRunning && (
            <Progress value={(currentAccess / accessCount) * 100} className="w-full" />
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hit Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.l1.enabled && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    L1 Cache
                  </span>
                  <div className="text-right">
                    <div className="font-semibold">{(stats.hitRates.l1 * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{stats.hitCounts.l1} hits</div>
                  </div>
                </div>
              )}
              
              {config.l2.enabled && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    L2 Cache
                  </span>
                  <div className="text-right">
                    <div className="font-semibold">{(stats.hitRates.l2 * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{stats.hitCounts.l2} hits</div>
                  </div>
                </div>
              )}
              
              {config.l3.enabled && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    L3 Cache
                  </span>
                  <div className="text-right">
                    <div className="font-semibold">{(stats.hitRates.l3 * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">{stats.hitCounts.l3} hits</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t pt-2">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  RAM Access
                </span>
                <div className="text-right">
                  <div className="font-semibold">{((1 - stats.hitRates.overall) * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">{stats.hitCounts.ram} misses</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-muted p-2 rounded">
                <span className="font-semibold">Overall Hit Rate</span>
                <span className="font-semibold">{(stats.hitRates.overall * 100).toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Average Latency</span>
                <span className="font-semibold">{stats.avgLatency.toFixed(1)} cycles</span>
              </div>
              <div className="flex justify-between">
                <span>Total Latency</span>
                <span className="font-semibold">{stats.totalLatency.toLocaleString()} cycles</span>
              </div>
              <div className="flex justify-between">
                <span>Total Accesses</span>
                <span className="font-semibold">{results.length}</span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold text-sm mb-2">Performance Impact</h4>
                <div className="text-xs space-y-1">
                  <div>• Higher hit rates = better performance</div>
                  <div>• L1 hits are fastest ({config.l1.accessTime} cycle)</div>
                  <div>• RAM misses are slowest ({config.ramAccessTime} cycles)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Access History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.slice(-20).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.type === 'read' ? 'default' : 'secondary'}>
                      {result.type}
                    </Badge>
                    <span className="font-mono">0x{result.address.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={
                        result.hitLevel === 'l1' ? 'border-blue-400 text-blue-600' :
                        result.hitLevel === 'l2' ? 'border-green-500 text-green-600' :
                        result.hitLevel === 'l3' ? 'border-yellow-500 text-yellow-600' :
                        'border-red-500 text-red-600'
                      }
                    >
                      {result.hitLevel.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground">{result.latency} cycles</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
