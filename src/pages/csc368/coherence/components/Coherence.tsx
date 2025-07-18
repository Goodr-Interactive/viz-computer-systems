import { useState } from "react";

interface MemoryVariable {
  var: string;
  address: number;
  core: number;
}
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    [ { var: "x", address: 0, core: 0 } ],
    [ { var: "y", address: 4, core: 1 } ],
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
    <div className="mx-auto w-full max-w-7xl space-y-3 p-2">
      {/* Cache Block Mapping */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Cache Blocks (size: {CACHE_BLOCK_SIZE} bytes)</h4>
        <div className="flex flex-col gap-3">
          {Object.entries(blockMap).map(([block, vars]: [string, MemoryVariable[]]) => {
            const blockNum = Number(block);
            // Get unique cores for this block
            const cores: number[] = Array.from(new Set(vars.map((v: MemoryVariable) => v.core)));
            const isSelected = selectedBlock === blockNum;
            // False sharing: multiple cores, different addresses
            const addresses = Array.from(new Set(vars.map(v => v.address)));
            const isFalseSharing = cores.length > 1 && addresses.length > 1;
            // True sharing: multiple cores, same address
            const blockTrueSharing = vars.some(v => trueSharingAddresses.includes(v.address));
            return (
              <div key={block} className={`flex flex-col gap-2 ${isSelected ? "ring-2 ring-blue-500 rounded-md" : ""}`}> 
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setSelectedBlock(isSelected ? null : blockNum)}
                    className="cursor-pointer group transition-colors duration-150 rounded group-hover:bg-gray-200"
                  >
                    <div
                      className={`relative flex items-center h-10 w-72 rounded-lg transition-colors duration-150 border
                        ${blockTrueSharing ? "bg-red-100 border-red-400" : isFalseSharing ? "bg-yellow-100 border-yellow-300" : "bg-blue-100 border-gray-400"}
                        group-hover:bg-gray-200 px-4 py-2 shadow-sm`}
                      title={`Block ${block} (0x${(blockNum * CACHE_BLOCK_SIZE).toString(16)}–0x${((blockNum + 1) * CACHE_BLOCK_SIZE - 1).toString(16)})`}
                    >
                      <span className="font-mono text-sm font-semibold">
                        Block {block} <span className="text-xs text-gray-500">(0x{(blockNum * CACHE_BLOCK_SIZE).toString(16)}–0x{((blockNum + 1) * CACHE_BLOCK_SIZE - 1).toString(16)})</span>
                      </span>
                      {/* Tooltip on hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full z-10 hidden group-hover:flex flex-col min-w-max bg-white border border-gray-200 rounded shadow p-2 mt-2">
                        <div className="mb-1 flex gap-2">
                          {cores.map((core: number) => (
                            <span key={core} className={`rounded-full px-2 py-1 text-xs font-bold ${coreColors[core]}`}>Core {core}</span>
                          ))}
                        </div>
                        {blockTrueSharing ? (
                          <span className="text-red-700 font-bold">True sharing: {vars.filter(v => trueSharingAddresses.includes(v.address)).map(v => v.var).join(", ")} shared by multiple cores</span>
                        ) : isFalseSharing ? (
                          <span className="text-yellow-700">False sharing: {vars.map((v: MemoryVariable) => v.var).join(", ")} share this block</span>
                        ) : (
                          <span className="text-blue-700">No sharing: {vars.map((v: MemoryVariable) => v.var).join(", ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs">Contains: {vars.map((v: MemoryVariable) => v.var).join(", ")}</span>
                  <div className="flex gap-1">
                    {cores.map((core: number) => (
                      <span key={core} className={`rounded-full px-2 py-1 text-xs font-bold ${coreColors[core]}`}>Core {core}</span>
                    ))}
                  </div>
                </div>
                {/* Expanded block data visualization only if selected */}
                {isSelected && (
                  <div className="mt-8 px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 overflow-x-auto flex flex-col items-center shadow-sm">
                    {blockTrueSharing && (
                      <div className="mb-2 text-red-700 font-bold text-sm">True sharing detected in this block!</div>
                    )}
                    {isFalseSharing && !blockTrueSharing && (
                      <div className="mb-2 text-yellow-700 font-bold text-sm">False sharing detected in this block!</div>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[...Array(CACHE_BLOCK_SIZE).keys()].map(byte => {
                        // Find variable(s) occupying this byte
                        const byteAddr = blockNum * CACHE_BLOCK_SIZE + byte;
                        const occupyingVars = vars.filter(v => v.address === byteAddr);
                        let style = "bg-white border-gray-300";
                        let label = "";
                        if (occupyingVars.length > 0) {
                          // True sharing: multiple cores, same address
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
                            className={`w-7 h-7 border rounded flex items-center justify-center text-[11px] font-mono ${style}`}
                          >
                            {occupyingVars.length > 0 ? occupyingVars.map(v => v.var).join("/") : ""}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      Each square represents a byte in the block. Colored squares show which variable(s) occupy each byte.<br />
                      <span className="text-red-700">Red = true sharing (multiple cores, same address).</span> <span className="text-yellow-700">Yellow = false sharing (multiple cores, different addresses).</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Details Panel for Selected Block */}
      {selectedBlock !== null && (
        (() => {
          // Determine true/false sharing for details panel
          const blockVars = blockMap[selectedBlock] || [];
          const blockCores = Array.from(new Set(blockVars.map((v: MemoryVariable) => v.core)));
          const blockAddresses = Array.from(new Set(blockVars.map((v: MemoryVariable) => v.address)));
          const blockTrueSharing = blockVars.some(v => trueSharingAddresses.includes(v.address));
          const blockFalseSharing = blockCores.length > 1 && blockAddresses.length > 1;
          return (
            <div className="mt-6 rounded-lg border border-blue-300 bg-blue-50 p-4">
              <h4 className="mb-2 text-base font-semibold text-blue-900">Block {selectedBlock} Details</h4>
              <div className="mb-2 flex gap-2">
                {blockCores.map((core: number) => (
                  <span key={core} className={`rounded-full px-2 py-1 text-xs font-bold ${coreColors[core]}`}>Core {core}</span>
                ))}
              </div>
              <div className="mb-2 text-sm">
                <strong>Variables:</strong> {blockVars.map((v: MemoryVariable) => v.var).join(", ") || "None"}
              </div>
              <div className="text-sm">
                <strong>Sharing Status:</strong> {blockTrueSharing ? <span className="text-red-700 font-bold">True sharing</span> : blockFalseSharing ? <span className="text-yellow-700">False sharing</span> : <span className="text-blue-700">No sharing</span>}
              </div>
            </div>
          );
        })()
      )}
      {/* Explanation */}
      <div className="mt-8">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>True sharing</strong> occurs when multiple cores access the same variable (same address), causing cache coherence traffic. Highlighted in yellow in the variable list.
              </p>
              <p>
                <strong>False sharing</strong> occurs when cores access different variables that reside in the same cache block, leading to unnecessary coherence traffic. Highlighted in yellow in the block list.
              </p>
              <p>
                Use the controls to add/remove variables for each core, change variable names and addresses. True sharing is shown when two or more cores have a variable with the same address. False sharing is shown when two or more cores have variables in the same block but with different addresses.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
