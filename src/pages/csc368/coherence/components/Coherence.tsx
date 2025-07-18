import { useState } from "react";

interface MemoryVariable {
  var: string;
  address: number;
  core: number;
}
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FalseSharingGrid } from "./FalseSharingGrid";
import { InteractiveFalseSharing } from "./InteractiveFalseSharing";
import { MSIFalseSharing } from "./MSIFalseSharing";

const CACHE_BLOCK_SIZE = 8;

function getBlock(address: number) {
  return Math.floor(address / CACHE_BLOCK_SIZE);
}


export function TrueFalseSharingViz() {
  const coreColors = [
    "bg-blue-500 text-white",
    "bg-red-500 text-white",
    "bg-green-500 text-white",
    "bg-purple-500 text-white",
    "bg-yellow-500 text-black",
  ];

  // Each core has its own variables
  const [coreVars] = useState<MemoryVariable[][]>([
    [ { var: "x", address: 0, core: 0 }, { var: "shared", address: 16, core: 0 } ],
    [ { var: "y", address: 4, core: 1 }, { var: "shared", address: 16, core: 1 } ],
    [ { var: "z", address: 64, core: 2 } ],
  ]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  
  // Flatten all variables for block mapping
  const allVars: MemoryVariable[] = coreVars.flat();
  const blockMap: Record<number, MemoryVariable[]> = {};
  allVars.forEach((v: MemoryVariable) => {
    const block = getBlock(v.address);
    if (!blockMap[block]) blockMap[block] = [];
    blockMap[block].push(v);
  });

  // True sharing detection: addresses accessed by >1 core
  const addressMap: Record<number, number[]> = {};
  allVars.forEach((v: MemoryVariable) => {
    if (!addressMap[v.address]) addressMap[v.address] = [];
    addressMap[v.address].push(v.core);
  });
  const trueSharingAddresses = Object.entries(addressMap)
    .filter(([_, cores]) => new Set(cores).size > 1)
    .map(([addr]) => Number(addr));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4">
      {/* MSI Cache Coherence Protocol Visualization */}
      <div className="mb-8">
        <MSIFalseSharing width={1000} height={600} />
      </div>
      
      {/* Interactive False Sharing Simulator */}
      <div className="mb-8">
        <InteractiveFalseSharing width={900} height={500} />
      </div>
      
      {/* Grid-based False Sharing Visualization */}
      <div className="mb-8">
        <FalseSharingGrid width={800} height={400} />
      </div>
      
      {/* Main Diagram-Style Visualization */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-center">Cache Coherence: True vs False Sharing</h3>
        
        {/* For each cache block, show the processor-cache-memory layout */}
        {Object.entries(blockMap).map(([block, vars]: [string, MemoryVariable[]]) => {
          const blockNum = Number(block);
          const cores: number[] = Array.from(new Set(vars.map((v: MemoryVariable) => v.core)));
          const addresses = Array.from(new Set(vars.map(v => v.address)));
          const isFalseSharing = cores.length > 1 && addresses.length > 1;
          const blockTrueSharing = vars.some(v => trueSharingAddresses.includes(v.address));
          const isSelected = selectedBlock === blockNum;
          
          if (cores.length <= 1) return null; // Only show blocks with sharing
          
          return (
            <div key={block} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="mb-4 text-center">
                <h4 className="text-md font-medium">
                  Cache Block {block} - {blockTrueSharing ? "True Sharing" : isFalseSharing ? "False Sharing" : "No Sharing"}
                </h4>
                <p className="text-sm text-gray-600">
                  Address range: 0x{(blockNum * CACHE_BLOCK_SIZE).toString(16)} - 0x{((blockNum + 1) * CACHE_BLOCK_SIZE - 1).toString(16)}
                </p>
              </div>
              
              {/* Processor-Cache-Memory Layout */}
              <div className="flex items-center justify-center gap-8">
                
                {/* Processors Column */}
                <div className="flex flex-col gap-4">
                  <div className="text-sm font-medium text-center mb-2">Processors</div>
                  {cores.map((core: number) => {
                    const coreVars = vars.filter(v => v.core === core);
                    return (
                      <div key={core} className="flex flex-col items-center gap-2">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center font-bold text-sm ${coreColors[core]} shadow-md`}>
                          P{core}
                        </div>
                        <div className="text-xs text-center">
                          {coreVars.map(v => `${v.var}@0x${v.address.toString(16)}`).join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Arrows and Cache */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm font-medium text-center mb-2">Cache Lines</div>
                  
                  {/* Cache Line Representation */}
                  <div 
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      blockTrueSharing ? 'bg-red-100 border-red-400' : 
                      isFalseSharing ? 'bg-yellow-100 border-yellow-400' : 
                      'bg-blue-100 border-blue-400'
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedBlock(isSelected ? null : blockNum)}
                  >
                    <div className="text-center mb-2">
                      <div className="font-mono text-sm font-semibold">Cache Line</div>
                      <div className="text-xs text-gray-600">Block {block}</div>
                    </div>
                    
                    {/* Byte-level visualization */}
                    <div className="flex gap-1">
                      {[...Array(CACHE_BLOCK_SIZE).keys()].map(byte => {
                        const byteAddr = blockNum * CACHE_BLOCK_SIZE + byte;
                        const occupyingVars = vars.filter(v => v.address === byteAddr);
                        let style = "bg-white border-gray-300";
                        let label = "";
                        
                        if (occupyingVars.length > 0) {
                          const uniqueCores = Array.from(new Set(occupyingVars.map(v => v.core)));
                          if (uniqueCores.length > 1) {
                            style = "bg-red-200 border-red-500";
                            label = `True Sharing: ${occupyingVars.map(v => v.var).join(", ")}`;
                          } else {
                            style = `${coreColors[occupyingVars[0].core]} border-blue-500`;
                            label = occupyingVars.map(v => v.var).join(", ");
                          }
                        }
                        
                        return (
                          <div
                            key={byte}
                            title={label || `Byte ${byteAddr}`}
                            className={`w-6 h-6 border rounded flex items-center justify-center text-[10px] font-mono ${style}`}
                          >
                            {occupyingVars.length > 0 ? occupyingVars.map(v => v.var).join("/") : ""}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Sharing indicator */}
                    {isFalseSharing && !blockTrueSharing && (
                      <div className="mt-2 text-xs text-yellow-700 font-bold text-center">
                        ⚠️ False Sharing - Artifactual Communication
                      </div>
                    )}
                    {blockTrueSharing && (
                      <div className="mt-2 text-xs text-red-700 font-bold text-center">
                        🔄 True Sharing - Intentional Communication
                      </div>
                    )}
                  </div>
                  
                  {/* Show ping-pong effect for false sharing */}
                  {isFalseSharing && !blockTrueSharing && (
                    <div className="flex items-center gap-2 text-xs text-yellow-700">
                      <span>Cache line "ping-pongs" between cores</span>
                      <div className="flex gap-1">
                        <span className="animate-pulse">⟷</span>
                        <span className="animate-pulse delay-150">⟷</span>
                        <span className="animate-pulse delay-300">⟷</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Memory Column */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm font-medium text-center mb-2">Memory</div>
                  <div className="grid grid-cols-1 gap-1 border rounded p-2 bg-gray-50">
                    {vars.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className={`w-3 h-3 rounded ${coreColors[v.core].split(' ')[0]}`}></div>
                        <span className="font-mono">{v.var}: 0x{v.address.toString(16)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Expanded details when selected */}
              {isSelected && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h5 className="font-medium mb-2">Detailed Analysis</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Cores involved:</strong> {cores.join(", ")}
                    </div>
                    <div>
                      <strong>Variables:</strong> {vars.map(v => `${v.var}@0x${v.address.toString(16)}`).join(", ")}
                    </div>
                    <div>
                      <strong>Sharing type:</strong> {
                        blockTrueSharing ? 
                          <span className="text-red-700 font-bold">True sharing - multiple cores access the same address</span> : 
                        isFalseSharing ? 
                          <span className="text-yellow-700 font-bold">False sharing - different addresses in the same cache line</span> : 
                          <span className="text-blue-700">No sharing</span>
                      }
                    </div>
                    {isFalseSharing && !blockTrueSharing && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <strong>Performance Impact:</strong> The cache line will bounce between cores unnecessarily, 
                        causing significant coherence traffic even though the cores are accessing different variables.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Explanation */}
      <div className="mt-8">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Understanding Cache Coherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-red-700">True Sharing:</strong> Multiple processors access the same variable (same memory address). 
                This causes legitimate cache coherence traffic as cores need to coordinate access to shared data.
              </div>
              <div>
                <strong className="text-yellow-700">False Sharing:</strong> Processors access different variables that happen to reside in the same cache line. 
                This creates <em>artifactual communication</em> - the cache line "ping-pongs" between cores unnecessarily, 
                generating significant coherence traffic even though the cores aren't actually sharing data.
              </div>
              <div>
                <strong>Performance Impact:</strong> False sharing can severely degrade performance in multi-core systems 
                as it forces cache lines to bounce between cores, causing unnecessary memory traffic and stalls.
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <strong>Current Examples:</strong> 
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>False Sharing:</strong> Core 0 accesses 'x' at 0x0, Core 1 accesses 'y' at 0x4 (same cache block)</li>
                  <li><strong>True Sharing:</strong> Both Core 0 and Core 1 access 'shared' at 0x10</li>
                  <li><strong>No Sharing:</strong> Core 2 accesses 'z' at 0x40 (different cache block)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
