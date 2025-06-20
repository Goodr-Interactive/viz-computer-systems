import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { BinaryBlock } from "./BinaryBlock";

interface CacheConfig {
  ways: number;
  cacheSize: number; // in KB
  blockSize: number; // in bytes
}

const CACHE_SIZE_KB = 64;
const BLOCK_SIZE_BYTES = 64;

const cacheModes: Record<string, CacheConfig> = {
  "Direct-Mapped (1-way)": { 
    ways: 1, 
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  },
  "2-Way Set Associative": { 
    ways: 2, 
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  },
  "4-Way Set Associative": { 
    ways: 4, 
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  },
  "8-Way Set Associative": { 
    ways: 8, 
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  },
  "16-Way Set Associative": { 
    ways: 16, 
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  },
  "Fully Associative": { 
    ways: 1024, // All blocks in one set
    cacheSize: CACHE_SIZE_KB, 
    blockSize: BLOCK_SIZE_BYTES 
  }
};

function getAddressPartition(config: CacheConfig): { tagBits: number; setBits: number; offsetBits: number } {
  const offsetBits = Math.log2(config.blockSize);
  // Calculate number of sets: total cache size / (ways * block size)
  const numSets = (config.cacheSize * 1024) / (config.ways * config.blockSize);
  const setBits = config.ways === 1024 ? 0 : Math.log2(numSets); // Fully associative has 0 set bits
  const tagBits = 32 - offsetBits - setBits;
  return { tagBits, setBits, offsetBits };
}

function getNumSets(config: CacheConfig): number {
  return (config.cacheSize * 1024) / (config.ways * config.blockSize);
}

interface AddressFieldProps {
  config: CacheConfig;
}

function AddressField({ config }: AddressFieldProps) {
  const { tagBits, setBits, offsetBits } = getAddressPartition(config);
  
  // For fully associative cache, don't show set field (0 bits)
  const showSet = setBits > 0;
  
  // Calculate bit ranges
  const offsetStart = 0;
  const offsetEnd = offsetBits - 1;
  const setStart = offsetBits;
  const setEnd = offsetBits + setBits - 1;
  const tagStart = offsetBits + setBits;
  const tagEnd = 31;
  
  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-medium text-center">Memory Address (32 bits)</h3>
      
      <div className="flex justify-center items-start gap-0">
        {/* Tag Block */}
        <BinaryBlock
          blocks={tagBits}
          color="bg-blue-100"
          borderColor="border-blue-300"
          hoverColor="group-hover:bg-blue-200"
          showLeftBorder={true}
          label={`Tag (${tagBits} bits: ${tagEnd}-${tagStart})`}
          startBitNumber={tagStart}
          tooltip={
            <div className="max-w-sm space-y-1">
              <p className="text-sm font-medium">Tag Field ({tagBits} bits)</p>
              <p className="text-xs">
                Identifies which memory block is stored in this cache location.
              </p>
            </div>
          }
        />
        
        {/* Set Block - only show if setBits > 0 */}
        {showSet && (
          <BinaryBlock
            blocks={setBits}
            color="bg-yellow-100"
            borderColor="border-yellow-300"
            hoverColor="group-hover:bg-yellow-200"
            showLeftBorder={false}
            label={`Set (${setBits} bits: ${setEnd}-${setStart})`}
            startBitNumber={setStart}
            tooltip={
              <div className="max-w-sm space-y-1">
                <p className="text-sm font-medium">Set Index Field ({setBits} bits)</p>
                <p className="text-xs">
                  Determines which set in the cache to access.
                </p>
              </div>
            }
          />
        )}
        
        {/* Offset Block */}
        <BinaryBlock
          blocks={offsetBits}
          color="bg-pink-100"
          borderColor="border-pink-300"
          hoverColor="group-hover:bg-pink-200"
          showLeftBorder={false}
          label={`Offset (${offsetBits} bits: ${offsetEnd}-${offsetStart})`}
          startBitNumber={offsetStart}
          tooltip={
            <div className="max-w-sm space-y-1">
              <p className="text-sm font-medium">Block Offset Field ({offsetBits} bits)</p>
              <p className="text-xs">
                Selects which byte within the cache block.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}

interface CacheArrayProps {
  config: CacheConfig;
}

function CacheArray({ config }: CacheArrayProps) {
  const numSets = getNumSets(config);
  const maxDisplaySets = 8; // Limit display for very large caches
  const displaySets = Math.min(numSets, maxDisplaySets);
  const showTruncated = numSets > maxDisplaySets;
  
  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-medium text-center">
        Cache Structure ({numSets} sets × {config.ways} ways)
        {showTruncated && <span className="text-sm text-gray-500 block">Showing first {maxDisplaySets} sets</span>}
      </h3>
      
      <div className="flex justify-center">
        <div className="inline-block border border-gray-300 rounded-lg p-4 bg-white shadow-sm max-w-full overflow-x-auto">
          {/* Header row with way labels */}
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `60px repeat(${Math.min(config.ways, 8)}, 80px)` }}>
            <div></div> {/* Empty cell for set labels column */}
            {[...Array(Math.min(config.ways, 8))].map((_, w) => (
              <div key={`way-header-${w}`} className="text-center text-sm font-medium text-gray-600">
                Way {w}
              </div>
            ))}
            {config.ways > 8 && (
              <div className="text-center text-sm font-medium text-gray-500">
                ... (+{config.ways - 8} more)
              </div>
            )}
          </div>
          
          {/* Cache blocks grid */}
          {[...Array(displaySets)].map((_, s) => (
            <div key={`set-${s}`} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `60px repeat(${Math.min(config.ways, 8)}, 80px)` }}>
              {/* Set label */}
              <div className="flex items-center justify-center text-sm font-medium text-gray-700">
                Set {s}
              </div>
              
              {/* Cache blocks for this set */}
              {[...Array(Math.min(config.ways, 8))].map((_, w) => (
                <div
                  key={`s${s}w${w}`}
                  className="h-9 bg-sky-100 border-2 border-sky-500 rounded flex items-center justify-center text-xs font-medium text-gray-700 hover:bg-sky-200 transition-colors"
                >
                  Block
                </div>
              ))}
              {config.ways > 8 && (
                <div className="h-9 flex items-center justify-center text-xs text-gray-500">
                  ...
                </div>
              )}
            </div>
          ))}
          
          {showTruncated && (
            <div className="text-center text-sm text-gray-500 mt-2">
              ... and {numSets - maxDisplaySets} more sets
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Associativity() {
  const [mode, setMode] = useState<string>("4-Way Set Associative");
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customConfig, setCustomConfig] = useState<CacheConfig>({
    ways: 4,
    cacheSize: CACHE_SIZE_KB,
    blockSize: BLOCK_SIZE_BYTES
  });
  
  const config: CacheConfig = useCustomConfig ? customConfig : cacheModes[mode];

  const updateCustomConfig = (field: keyof CacheConfig, value: number) => {
    setCustomConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full space-y-6 flex flex-col items-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Cache Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex items-center gap-4">
              <label className="text-lg font-medium">Configuration Mode:</label>
              <Select 
                value={useCustomConfig ? "custom" : mode} 
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomConfig(true);
                  } else {
                    setUseCustomConfig(false);
                    setMode(value);
                  }
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cacheModes).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Configuration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Cache Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Cache Size:</span>
                  <div className="text-blue-900">{config.cacheSize} KB</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Block Size:</span>
                  <div className="text-blue-900">{config.blockSize} bytes</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Total Sets:</span>
                  <div className="text-blue-900">{getNumSets(config)}</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Ways per Set:</span>
                  <div className="text-blue-900">{config.ways}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                Total cache blocks: {(config.cacheSize * 1024) / config.blockSize} | 
                Address partition: {getAddressPartition(config).tagBits} tag + {getAddressPartition(config).setBits} set + {getAddressPartition(config).offsetBits} offset bits
              </div>
            </div>

            {/* Custom Configuration Controls */}
            {useCustomConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cache Size: {customConfig.cacheSize} KB (fixed)
                  </label>
                  <div className="text-xs text-gray-600">
                    Educational example uses 64KB cache
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Block Size: {customConfig.blockSize} bytes (fixed)
                  </label>
                  <div className="text-xs text-gray-600">
                    Educational example uses 64-byte blocks
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ways per Set: {customConfig.ways}
                  </label>
                  <Slider
                    value={[customConfig.ways]}
                    onValueChange={([value]) => updateCustomConfig('ways', value)}
                    min={1}
                    max={32}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600">
                    Computed Sets: {getNumSets(customConfig)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Configuration Summary
                  </label>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Total Blocks: {(customConfig.cacheSize * 1024) / customConfig.blockSize}</div>
                    <div>Sets: {getNumSets(customConfig)}</div>
                    <div>Ways: {customConfig.ways}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-6xl space-y-8">
        <AddressField config={config} />
        <CacheArray config={config} />
      </div>
    </div>
  );
}
