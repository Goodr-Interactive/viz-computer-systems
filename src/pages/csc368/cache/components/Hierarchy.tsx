import React, { useState, useEffect, useRef } from "react";

// Cache configuration for L1
const L1_CACHE_CONFIG = {
  size: 32, // 32 bytes
  blockSize: 8, // 8 bytes per block (2 words, 2 blocks per cache line)
  associativity: 2, // 2-way set associative
  sets: 2, // 32 bytes / (8 bytes/block * 2 ways) = 2 sets
};
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
import { BinaryBlock } from "./BinaryBlock";
import { stageSizesConfig, latencyConfigUIEnabled, accessCountsUIEnabled } from "./Config";

const ACCESS_PATTERNS = {
  temporal: "temporal",
  spatial: "spatial",
  noLocality: "noLocality",
};

// Memory instruction types
interface MemoryInstruction {
  id: number;
  type: "load" | "store";
  address: number;
  data?: number;
  description: string;
}

// Generate 10 memory instructions with different access patterns
const generateInstructions = (pattern: keyof typeof ACCESS_PATTERNS): MemoryInstruction[] => {
  const instructions: MemoryInstruction[] = [];

  if (pattern === "temporal") {
    // Temporal locality: access same addresses repeatedly with some variation
    const baseAddresses = [0x1000, 0x1004, 0x1008, 0x1010];
    for (let i = 0; i < 10; i++) {
      let addr;
      if (i < 3) {
        // First few accesses to different addresses
        addr = baseAddresses[i];
      } else if (i < 7) {
        // Repeat earlier addresses for temporal locality
        addr = baseAddresses[i % 3];
      } else {
        // Mix of repeated and new addresses
        addr = i === 7 ? 0x1014 : baseAddresses[(i - 1) % baseAddresses.length];
      }

      instructions.push({
        id: i + 1,
        type: i % 3 === 0 ? "store" : "load",
        address: addr,
        data: i % 3 === 0 ? 0xdeadbeef + i : undefined,
        description: `${i % 3 === 0 ? "Store" : "Load"} 0x${addr.toString(16).toUpperCase()}`,
      });
    }
  } else if (pattern === "spatial") {
    // Spatial locality: access consecutive addresses with some repetition to show spatial benefits
    const baseAddr = 0x2000;
    for (let i = 0; i < 10; i++) {
      let addr;
      if (i < 4) {
        // Sequential access to nearby addresses
        addr = baseAddr + i * 4;
      } else if (i < 6) {
        // Repeat some earlier addresses to show spatial locality benefit
        addr = baseAddr + (i - 4) * 4; // Repeat 0x2000, 0x2004
      } else if (i < 8) {
        // Continue sequential pattern
        addr = baseAddr + (i - 4) * 4; // 0x2008, 0x200C
      } else {
        // Access nearby addresses again
        addr = baseAddr + (i - 8) * 4; // Repeat 0x2000, 0x2004
      }

      instructions.push({
        id: i + 1,
        type: i % 4 === 0 ? "store" : "load",
        address: addr,
        data: i % 4 === 0 ? 0xcafebabe + i : undefined,
        description: `${i % 4 === 0 ? "Store" : "Load"} 0x${addr.toString(16).toUpperCase()}`,
      });
    }
  } else {
    // No locality: diverse addresses that will cause cache conflicts
    const noLocalityAddresses = [
      0x3000,
      0x4000,
      0x5000,
      0x6000, // Different cache sets
      0x3040,
      0x4040,
      0x5040, // Same sets as first 3, different tags (conflicts)
      0x7000,
      0x8000,
      0x9000, // More different addresses
    ];

    for (let i = 0; i < 10; i++) {
      const addr = noLocalityAddresses[i];
      instructions.push({
        id: i + 1,
        type: i % 2 === 0 ? "store" : "load",
        address: addr,
        data: i % 2 === 0 ? 0xdeadbeef + i : undefined,
        description: `${i % 2 === 0 ? "Store" : "Load"} 0x${addr.toString(16).toUpperCase()}`,
      });
    }
  }
  return instructions;
};

// Cache simulation state
interface CacheBlock {
  valid: boolean;
  tag: number;
  data: number;
  lastAccessed: number;
}

interface CacheSet {
  blocks: CacheBlock[];
}

type CacheState = CacheSet[];

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_accessCounts, setAccessCounts] = useState({ l1: 0, l2: 0, ram: 0 }); // Total accesses to each level
  const [hitMissData, setHitMissData] = useState({
    l1: { hits: 0, misses: 0 },
    l2: { hits: 0, misses: 0 },
    ram: { hits: 0, misses: 0 },
  }); // Hit/miss breakdown for stacked bar chart
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentAccessLevel, setCurrentAccessLevel] = useState<keyof typeof latencyConfig | null>(
    null
  );

  // New state for memory instruction simulation
  const [memoryInstructions, setMemoryInstructions] = useState<MemoryInstruction[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const currentInstructionIndexRef = useRef(0);
  const [cacheState, setCacheState] = useState<CacheState>(() => {
    // Initialize empty cache
    const cache: CacheState = [];
    for (let i = 0; i < L1_CACHE_CONFIG.sets; i++) {
      cache.push({
        blocks: Array(L1_CACHE_CONFIG.associativity)
          .fill(null)
          .map(() => ({
            valid: false,
            tag: 0,
            data: 0,
            lastAccessed: 0,
          })),
      });
    }
    return cache;
  });
  const [accessHistory, setAccessHistory] = useState<
    Array<{
      instruction: MemoryInstruction;
      hit: boolean;
      level: "l1" | "l2" | "ram";
      latency: number;
    }>
  >([]);
  const [expandedInstructions, setExpandedInstructions] = useState<Set<number>>(new Set());
  const memoryTraceRef = useRef<HTMLDivElement>(null);

  // Cache simulation functions
  const getAddressParts = (address: number) => {
    const byteOffset = address & 0x7; // Last 3 bits (8-byte blocks)
    const wordOffset = (address >> 2) & 0x1; // Bit 2: which word in the block (0 or 1)
    const byteInWord = address & 0x3; // Bits 0-1: which byte in the word (0-3)
    const setIndex = (address >> 3) & 0x1; // Next 1 bit (2 sets)
    const tag = address >> 4; // Remaining bits
    return { byteOffset, wordOffset, byteInWord, setIndex, tag };
  };

  const simulateL1Access = (
    instruction: MemoryInstruction,
    currentCache: CacheState
  ): { hit: boolean; latency: number; newCacheState: CacheState } => {
    const { setIndex, tag } = getAddressParts(instruction.address);
    const set = currentCache[setIndex];

    console.log(`Instruction ${instruction.id}: ${instruction.description}`);
    console.log(
      `  Address: 0x${instruction.address.toString(16)}, Set: ${setIndex}, Tag: 0x${tag.toString(16)}`
    );

    // Create a deep copy of cache state for modifications
    const newCacheState = currentCache.map((cacheSet) => ({
      blocks: cacheSet.blocks.map((block) => ({ ...block })),
    }));

    // Check for hit
    const hitBlock = set.blocks.find((block) => block.valid && block.tag === tag);

    if (hitBlock) {
      // Cache hit - update the block in new state
      const hitBlockIndex = set.blocks.indexOf(hitBlock);
      newCacheState[setIndex].blocks[hitBlockIndex].lastAccessed = Date.now();
      if (instruction.type === "store" && instruction.data !== undefined) {
        newCacheState[setIndex].blocks[hitBlockIndex].data = instruction.data;
      }
      console.log(`  → HIT in set ${setIndex}, way ${hitBlockIndex}`);
      return { hit: true, latency: latencyConfig.l1, newCacheState };
    } else {
      // Cache miss - need to load from memory
      // Find replacement block (LRU)
      let replaceBlockIndex = 0;
      let replaceBlock = set.blocks[0];

      for (let i = 0; i < set.blocks.length; i++) {
        const block = set.blocks[i];
        if (!block.valid) {
          replaceBlock = block;
          replaceBlockIndex = i;
          break;
        }
        if (block.lastAccessed < replaceBlock.lastAccessed) {
          replaceBlock = block;
          replaceBlockIndex = i;
        }
      }

      console.log(
        `  → MISS in set ${setIndex}, replacing way ${replaceBlockIndex} (was tag: 0x${replaceBlock.tag.toString(16)}, valid: ${replaceBlock.valid})`
      );

      // Load block from memory in new state
      newCacheState[setIndex].blocks[replaceBlockIndex] = {
        valid: true,
        tag: tag,
        data: instruction.data || 0,
        lastAccessed: Date.now(),
      };

      // Add L2 latency to total when going to RAM
      return {
        hit: false,
        latency: latencyConfig.l1 + latencyConfig.l2 + latencyConfig.ram,
        newCacheState,
      };
    }
  };

  const executeNextInstruction = () => {
    if (currentInstructionIndexRef.current >= memoryInstructions.length) {
      console.log("All instructions executed, stopping simulation.");
      setIsSimulating(false);
      stopSimulation();
      return;
    }

    const instruction = memoryInstructions[currentInstructionIndexRef.current];

    // Use functional state update to get current cache state
    setCacheState((currentCache) => {
      const result = simulateL1Access(instruction, currentCache);

      // Update access history
      setAccessHistory((prev) => [
        ...prev,
        {
          instruction,
          hit: result.hit,
          level: result.hit ? "l1" : "ram",
          latency: result.latency,
        },
      ]);

      // Update hit/miss statistics for L1 and L2
      setHitMissData((prev) => ({
        ...prev,
        l1: {
          hits: prev.l1.hits + (result.hit ? 1 : 0),
          misses: prev.l1.misses + (result.hit ? 0 : 1),
        },
        l2: {
          // L2 is accessed only on L1 miss, and since we're simulating L1-only,
          // all L1 misses result in L2 misses (go to RAM)
          hits: prev.l2.hits, // No L2 hits in this simple simulation
          misses: prev.l2.misses + (result.hit ? 0 : 1), // L1 miss = L2 miss
        },
        ram: {
          hits: prev.ram.hits + (result.hit ? 0 : 1), // RAM access on L1 miss
          misses: prev.ram.misses,
        },
      }));

      // Update cache statistics
      setCacheStats((prev) => ({
        ...prev,
        totalAccesses: prev.totalAccesses + 1,
        cacheHits: prev.cacheHits + (result.hit ? 1 : 0),
        cacheMisses: prev.cacheMisses + (result.hit ? 0 : 1),
        totalLatency: prev.totalLatency + result.latency,
        subsequentAccessLatency: result.latency,
      }));

      // Calculate and update AMAT based on actual simulation results
      const newTotalAccesses = currentInstructionIndexRef.current + 1;
      const newCacheHits = hitMissData.l1.hits + (result.hit ? 1 : 0);

      if (newTotalAccesses > 0) {
        const l1HitRate = newCacheHits / newTotalAccesses;
        const l1MissRate = 1 - l1HitRate;
        const calculatedAmat = latencyConfig.l1 + l1MissRate * latencyConfig.ram;
        setAmat(calculatedAmat);
      }

      // Highlight the accessed level
      setHighlightedStages(new Set(result.hit ? ["cpu", "l1"] : ["cpu", "l1", "l2", "ram"]));

      setTimeout(() => {
        setHighlightedStages(new Set());
      }, 800);

      return result.newCacheState;
    });

    // Update both the ref and state synchronously
    currentInstructionIndexRef.current += 1;
    setCurrentInstructionIndex(currentInstructionIndexRef.current);
  };

  // State to track which stages should be highlighted during access
  const [highlightedStages, setHighlightedStages] = useState<Set<string>>(new Set());

  const [cacheStats, setCacheStats] = useState({
    subsequentAccessLatency: latencyConfig.l1, // Reduced latency for subsequent accesses
    cacheMisses: 0, // Tracks the number of cache misses
    totalAccesses: 0, // Total number of access simulations
    cacheHits: 0, // Total number of cache hits (L1 or L2, not RAM)
    totalLatency: 0, // Cumulative latency across all accesses
  });

  // Reset simulation when access pattern changes to avoid stale data
  useEffect(() => {
    resetSimulation();

    // Generate new instructions for the selected pattern
    const newInstructions = generateInstructions(selectedPattern);
    setMemoryInstructions(newInstructions);

    // AMAT will be calculated dynamically as the simulation runs
    setAmat(null);
  }, [selectedPattern, latencyConfig]);

  // Auto-scroll to current instruction in memory trace
  useEffect(() => {
    if (memoryTraceRef.current && isSimulating && currentInstructionIndex > 0) {
      const currentInstructionElement = memoryTraceRef.current.querySelector(
        `[data-instruction-id="${currentInstructionIndex}"]`
      );
      if (currentInstructionElement) {
        const container = memoryTraceRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = currentInstructionElement.getBoundingClientRect();

        // Calculate the position to scroll to center the element in the container
        const containerCenter = containerRect.height / 2;
        const elementCenter = elementRect.height / 2;
        const scrollTop =
          container.scrollTop +
          (elementRect.top - containerRect.top) -
          containerCenter +
          elementCenter;

        // Smooth scroll within the container
        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [currentInstructionIndex, isSimulating]);

  const startSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    setIsSimulating(true);
    const interval = setInterval(() => {
      executeNextInstruction();
    }, 1500); // Slower pace to see each instruction

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
    currentInstructionIndexRef.current = 0;
    setCurrentInstructionIndex(0);

    // Reset cache state
    setCacheState(() => {
      const cache: CacheState = [];
      for (let i = 0; i < L1_CACHE_CONFIG.sets; i++) {
        cache.push({
          blocks: Array(L1_CACHE_CONFIG.associativity)
            .fill(null)
            .map(() => ({
              valid: false,
              tag: 0,
              data: 0,
              lastAccessed: 0,
            })),
        });
      }
      return cache;
    });

    // Reset all state to initial values
    setAmat(null);
    setAccessCounts({ l1: 0, l2: 0, ram: 0 });
    setHitMissData({
      l1: { hits: 0, misses: 0 },
      l2: { hits: 0, misses: 0 },
      ram: { hits: 0, misses: 0 },
    });
    setAccessHistory([]);
    setCacheStats({
      subsequentAccessLatency: latencyConfig.l1,
      cacheMisses: 0,
      totalAccesses: 0,
      cacheHits: 0,
      totalLatency: 0,
    });
    setCurrentAccessLevel(null);
    setHighlightedStages(new Set());
    setExpandedInstructions(new Set());
  };

  const toggleInstructionExpansion = (instructionId: number) => {
    setExpandedInstructions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(instructionId)) {
        newSet.delete(instructionId);
      } else {
        newSet.add(instructionId);
      }
      return newSet;
    });
  };

  const renderMemoryInstructions = () => (
    <div className="space-y-4">
      {/* <h4 className="text-lg font-semibold">Memory Trace ({memoryInstructions.length})</h4> */}
      <div className="max-h-64 space-y-2 overflow-y-auto" ref={memoryTraceRef}>
        {memoryInstructions.map((instruction, index) => {
          const isExpanded = expandedInstructions.has(instruction.id);
          const isExecuted = index < currentInstructionIndex;
          const isCurrent = index === currentInstructionIndex;

          return (
            <div
              key={instruction.id}
              data-instruction-id={instruction.id}
              className={`rounded-lg border-2 transition-all ${
                isCurrent
                  ? "border-blue-500 bg-blue-50"
                  : isExecuted
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              {/* Compressed View - Always Visible */}
              <div
                className={`cursor-pointer p-3 transition-colors ${
                  isCurrent
                    ? "hover:bg-blue-100"
                    : isExecuted
                      ? "hover:bg-green-100"
                      : "hover:bg-gray-100"
                }`}
                onClick={() => toggleInstructionExpansion(instruction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-medium">
                      {instruction.id.toString().padStart(2, "0")}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        instruction.type === "load"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {instruction.type.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm">{instruction.description}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isExecuted && accessHistory[index] && (
                      <>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            accessHistory[index].hit
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {accessHistory[index].hit ? "HIT" : "MISS"}
                        </span>
                        <span className="text-xs text-gray-600">
                          {accessHistory[index].latency} cycles
                        </span>
                      </>
                    )}
                    {/* Expansion indicator */}
                    <span className="ml-2 text-xs text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Address Breakdown - Only when clicked */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 text-xs font-medium text-gray-700">Address Breakdown</div>
                  <div className="flex items-center space-x-0">
                    {(() => {
                      const { tag, setIndex, wordOffset, byteInWord } = getAddressParts(
                        instruction.address
                      );

                      // Convert values to binary strings with proper padding
                      const tagBinary = tag.toString(2).padStart(12, "0");
                      const setIndexBinary = setIndex.toString(2).padStart(1, "0");
                      const wordOffsetBinary = wordOffset.toString(2).padStart(1, "0");
                      const byteInWordBinary = byteInWord.toString(2).padStart(2, "0");

                      return (
                        <div className="flex items-end">
                          <BinaryBlock
                            blocks={12}
                            color="bg-blue-100"
                            borderColor="border-blue-300"
                            hoverColor="group-hover:bg-blue-200"
                            showLeftBorder={true}
                            label={
                              <div className="text-center">
                                <div>Tag</div>
                                <div>0x{tag.toString(16).toUpperCase()}</div>
                              </div>
                            }
                            className="text-xs"
                            binaryValue={tagBinary}
                          />
                          <BinaryBlock
                            blocks={1}
                            color="bg-yellow-100"
                            borderColor="border-yellow-300"
                            hoverColor="group-hover:bg-yellow-200"
                            showLeftBorder={false}
                            label={
                              <div className="text-center">
                                <div>Set</div>
                                <div>{setIndex}</div>
                              </div>
                            }
                            className="text-xs"
                            binaryValue={setIndexBinary}
                          />
                          <BinaryBlock
                            blocks={1}
                            color="bg-purple-100"
                            borderColor="border-purple-300"
                            hoverColor="group-hover:bg-purple-200"
                            showLeftBorder={false}
                            label={
                              <div className="text-center">
                                <div>Word</div>
                                <div>{wordOffset}</div>
                              </div>
                            }
                            className="text-xs"
                            binaryValue={wordOffsetBinary}
                          />
                          <BinaryBlock
                            blocks={2}
                            color="bg-green-100"
                            borderColor="border-green-300"
                            hoverColor="group-hover:bg-green-200"
                            showLeftBorder={false}
                            label={
                              <div className="text-center">
                                <div>Byte</div>
                                <div>{byteInWord}</div>
                              </div>
                            }
                            className="text-xs"
                            binaryValue={byteInWordBinary}
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Additional details */}
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Full Address:</span>
                      <div className="font-mono">
                        0x{instruction.address.toString(16).toUpperCase().padStart(8, "0")}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Instruction Type:</span>
                      <div className="capitalize">{instruction.type}</div>
                    </div>
                    {instruction.data !== undefined && (
                      <div>
                        <span className="font-medium text-gray-600">Data:</span>
                        <div className="font-mono">
                          0x{instruction.data.toString(16).toUpperCase()}
                        </div>
                      </div>
                    )}
                    {isExecuted && accessHistory[index] && (
                      <div>
                        <span className="font-medium text-gray-600">Cache Result:</span>
                        <div
                          className={`font-medium ${
                            accessHistory[index].hit ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {accessHistory[index].hit ? "Hit" : "Miss"} (
                          {accessHistory[index].level.toUpperCase()})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {memoryInstructions.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Select an access pattern and start simulation to see memory trace
          </div>
        )}
      </div>
    </div>
  );

  const renderCacheVisualization = () => (
    <TooltipProvider>
      <div className="space-y-4">
        {/* <h4 className="text-lg font-semibold">L1 Cache State (2-way, 2 sets)</h4> */}
        <div className="grid grid-cols-1 gap-2">
          {cacheState.map((set, setIndex) => (
            <div key={setIndex} className="rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">Set {setIndex}</div>
              <div className="grid grid-cols-2 gap-2">
                {set.blocks.map((block, wayIndex) => (
                  <Dialog key={wayIndex}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <div
                            className={`cursor-pointer rounded border-2 p-2 text-center text-sm transition-colors ${
                              block.valid
                                ? "border-green-500 bg-green-50 hover:bg-green-100"
                                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="font-medium">Way {wayIndex}</div>
                            {block.valid ? (
                              <>
                                <div className="text-xs text-gray-600">
                                  Tag: 0x{block.tag.toString(16).toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Data: 0x{block.data.toString(16).toUpperCase()}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-500">Empty</div>
                            )}
                          </div>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to view detailed cache block information</p>
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Cache Block Details - Set {setIndex}, Way {wayIndex}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Block Status</div>
                            <div
                              className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                block.valid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {block.valid ? "VALID" : "INVALID"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Cache Set</div>
                            <div className="text-sm text-gray-600">Set {setIndex}</div>
                          </div>
                        </div>

                        {block.valid ? (
                          <>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Tag Information</div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>Hex: 0x{block.tag.toString(16).toUpperCase()}</div>
                                <div>Decimal: {block.tag}</div>
                                <div>Binary: {block.tag.toString(2).padStart(12, "0")}</div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium">Stored Data</div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>Hex: 0x{block.data.toString(16).toUpperCase()}</div>
                                <div>Decimal: {block.data}</div>
                                <div>Binary: {block.data.toString(2).padStart(32, "0")}</div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium">Access Information</div>
                              <div className="text-sm text-gray-600">
                                Last accessed: {new Date(block.lastAccessed).toLocaleTimeString()}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium">Memory Address Range</div>
                              <div className="text-sm text-gray-600">
                                This block caches data from memory addresses where:
                                <br />• Tag = 0x{block.tag.toString(16).toUpperCase()}
                                <br />• Set = {setIndex}
                                <br />• Block size = {L1_CACHE_CONFIG.blockSize} bytes
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Empty Block</div>
                            <div className="text-sm text-gray-600">
                              This cache block is currently empty and available for new data. When a
                              memory access results in a cache miss for this set, new data may be
                              loaded into this block.
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );

  const renderHierarchy = () => (
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
    // Calculate actual hit rates from the real simulation results
    // In this simulation: L1 hit = data found in L1, L1 miss = check L2, L2 miss = go to RAM
    const actualHitCounts = {
      l1: cacheStats.cacheHits, // Actual L1 hits
      l2: 0, // In this simplified simulation, we don't simulate L2 storage, so no L2 hits
      ram: cacheStats.cacheMisses, // L1 misses that result in RAM access (via L2 miss)
    };

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
            <span className="text-muted-foreground text-sm font-medium">L1 Cache Hits</span>
            <span className="text-lg font-semibold text-green-600">{cacheStats.cacheHits}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">L1 Cache Misses</span>
            <span className="text-lg font-semibold text-red-600">{cacheStats.cacheMisses}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium">L2 Misses → RAM</span>
            <span className="text-lg font-semibold text-orange-600">{cacheStats.cacheMisses}</span>
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
            Actual Simulation Results (
            {selectedPattern === "temporal"
              ? "Temporal"
              : selectedPattern === "spatial"
                ? "Spatial"
                : "No Locality"}
            ) Hit Distribution
          </h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(actualHitCounts).map(([level, count]) => {
              const hitRate =
                cacheStats.totalAccesses > 0 ? (count / cacheStats.totalAccesses) * 100 : 0;
              return (
                <div key={level} className="flex flex-col rounded bg-gray-50 px-2 py-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    {level.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{hitRate.toFixed(1)}%</span>
                  <span className="text-muted-foreground text-xs">
                    ({count}/{cacheStats.totalAccesses})
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
    <TooltipProvider>
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
                <Button
                  onClick={startSimulation}
                  disabled={
                    isSimulating || currentInstructionIndexRef.current >= memoryInstructions.length
                  }
                >
                  Start Simulation
                </Button>
                <Button onClick={stopSimulation} disabled={!isSimulating}>
                  Stop Simulation
                </Button>
                <Button onClick={resetSimulation} variant="outline">
                  Reset
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Instruction {Math.min(currentInstructionIndex, memoryInstructions.length)} of{" "}
                {memoryInstructions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Memory Instructions and Cache State */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Memory Trace</CardTitle>
            </CardHeader>
            <CardContent>{renderMemoryInstructions()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>L1 Cache State</CardTitle>
            </CardHeader>
            <CardContent>{renderCacheVisualization()}</CardContent>
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
    </TooltipProvider>
  );
};
