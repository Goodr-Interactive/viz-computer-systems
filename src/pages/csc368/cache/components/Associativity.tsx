import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { BinaryBlock } from "./BinaryBlock";
// Import the SVG assets for hardware visualization
import ComparatorSvg from "@/assets/comparator.svg";
import MultiplexerSvg from "@/assets/mux.svg";
import DecoderSvg from "@/assets/decoder.svg";

interface CacheConfig {
  ways: number;
  cacheSize: number; // in KB
  blockSizeWords: number; // number of words per block
  wordSize: number; // bytes per word
}

const CACHE_SIZE_KB = 0.03125; // 32 bytes = 0.03125 KB (8 words × 4 bytes)
const WORD_SIZE_BYTES = 4; // 4 bytes per word (32-bit words)
const DEFAULT_BLOCK_SIZE_WORDS = 1; // 1 word per block by default

const cacheModes: Record<string, CacheConfig> = {
  "Direct-Mapped (1-way, 1 word)": { 
    ways: 1, 
    cacheSize: CACHE_SIZE_KB, 
    blockSizeWords: 1,
    wordSize: WORD_SIZE_BYTES
  },
  "Direct-Mapped (1-way, 2 words)": { 
    ways: 1, 
    cacheSize: CACHE_SIZE_KB, 
    blockSizeWords: 2,
    wordSize: WORD_SIZE_BYTES
  },
  "2-Way Set Associative": { 
    ways: 2, 
    cacheSize: CACHE_SIZE_KB, 
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES
  },
  "4-Way Set Associative": { 
    ways: 4, 
    cacheSize: CACHE_SIZE_KB, 
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES
  },
  "Fully Associative": { 
    ways: 8, // All 8 words in one set
    cacheSize: CACHE_SIZE_KB, 
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES
  }
};

function getBlockSizeBytes(config: CacheConfig): number {
  return config.blockSizeWords * config.wordSize;
}

function getAddressPartition(config: CacheConfig): { tagBits: number; setBits: number; offsetBits: number; wordOffsetBits: number; byteOffsetBits: number } {
  const blockSizeBytes = getBlockSizeBytes(config);
  const offsetBits = Math.log2(blockSizeBytes);
  const wordOffsetBits = Math.log2(config.blockSizeWords); // Bits to select word within block
  const byteOffsetBits = Math.log2(config.wordSize); // Bits to select byte within word (always 2 for 4-byte words)
  
  // Calculate number of sets: total cache size / (ways * block size in bytes)
  const numSets = (config.cacheSize * 1024) / (config.ways * blockSizeBytes);
  const setBits = numSets === 1 ? 0 : Math.log2(numSets); // Fully associative has 0 set bits
  const tagBits = 32 - offsetBits - setBits;
  return { tagBits, setBits, offsetBits, wordOffsetBits, byteOffsetBits };
}

function getNumSets(config: CacheConfig): number {
  const blockSizeBytes = getBlockSizeBytes(config);
  return (config.cacheSize * 1024) / (config.ways * blockSizeBytes);
}

interface AddressFieldProps {
  config: CacheConfig;
}

function AddressField({ config }: AddressFieldProps) {
  const { tagBits, setBits, offsetBits, wordOffsetBits, byteOffsetBits } = getAddressPartition(config);
  
  // For fully associative cache, don't show set field (0 bits)
  const showSet = setBits > 0;
  const showWordOffset = wordOffsetBits > 0; // Only show if block has multiple words
  
  // Calculate bit ranges
  const byteOffsetStart = 0;
  const byteOffsetEnd = byteOffsetBits - 1;
  const wordOffsetStart = byteOffsetBits;
  const wordOffsetEnd = byteOffsetBits + wordOffsetBits - 1;
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
        
        {/* Block Offset - only show if block has multiple words */}
        {showWordOffset && (
          <BinaryBlock
            blocks={wordOffsetBits}
            color="bg-green-100"
            borderColor="border-green-300"
            hoverColor="group-hover:bg-green-200"
            showLeftBorder={false}
            label={`Block Offset (${wordOffsetBits} bits: ${wordOffsetEnd}-${wordOffsetStart})`}
            startBitNumber={wordOffsetStart}
            tooltip={
              <div className="max-w-sm space-y-1">
                <p className="text-sm font-medium">Block Offset Field ({wordOffsetBits} bits)</p>
                <p className="text-xs">
                  Selects which word within the cache block ({config.blockSizeWords} words).
                </p>
              </div>
            }
          />
        )}
        
        {/* Byte Offset Block */}
        <BinaryBlock
          blocks={byteOffsetBits}
          color="bg-pink-100"
          borderColor="border-pink-300"
          hoverColor="group-hover:bg-pink-200"
          showLeftBorder={false}
          label={`Byte Offset (${byteOffsetBits} bits: ${byteOffsetEnd}-${byteOffsetStart})`}
          startBitNumber={byteOffsetStart}
          tooltip={
            <div className="max-w-sm space-y-1">
              <p className="text-sm font-medium">Byte Offset Field ({byteOffsetBits} bits)</p>
              <p className="text-xs">
                Selects which byte within the word ({config.wordSize} bytes per word).
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

interface HardwareComplexityProps {
  config: CacheConfig;
}

function HardwareComplexity({ config }: HardwareComplexityProps) {
  // Calculate hardware requirements
  const numComparators = config.ways; // One comparator per way for tag comparison
  const muxSize = config.ways; // MUX size equals number of ways
  
  // Determine complexity level for visualization
  const getComplexityLevel = () => {
    if (config.ways === 1) return "Low";
    if (config.ways <= 2) return "Medium";
    if (config.ways <= 4) return "High";
    return "Very High";
  };

  const complexityLevel = getComplexityLevel();
  const complexityColor = {
    "Low": "text-green-600 bg-green-50 border-green-200",
    "Medium": "text-yellow-600 bg-yellow-50 border-yellow-200", 
    "High": "text-orange-600 bg-orange-50 border-orange-200",
    "Very High": "text-red-600 bg-red-50 border-red-200"
  }[complexityLevel];

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Hardware Complexity Analysis
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${complexityColor}`}>
            {complexityLevel} Complexity
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Hardware Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Comparators:</span>
                <div className="text-blue-900">{numComparators} units</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Multiplexer Size:</span>
                <div className="text-blue-900">{config.ways === 1 ? "No MUX needed" : `${muxSize}-to-1 MUX`}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Decoder:</span>
                <div className="text-blue-900">{getAddressPartition(config).setBits === 0 ? "No decoder needed" : `${getAddressPartition(config).setBits}-to-${Math.pow(2, getAddressPartition(config).setBits)} decoder`}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Hit Logic:</span>
                <div className="text-blue-900">{config.ways === 1 ? "Simple" : "Complex OR gate"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Comparator Visualization */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-center">Tag Comparators</h4>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {[...Array(Math.min(numComparators, 8))].map((_, i) => (
                    <div key={i} className="relative">
                      <img 
                        src={ComparatorSvg} 
                        alt={`Comparator ${i + 1}`} 
                        className="w-12 h-12" 
                      />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-white px-1 rounded border">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                  {numComparators > 8 && (
                    <div className="flex items-center text-gray-500 text-sm">
                      +{numComparators - 8} more
                    </div>
                  )}
                </div>
                {/* <div className="text-center text-sm text-gray-600 max-w-sm">
                  Each way requires a separate comparator to check if the tag matches. 
                  More ways = more comparators = higher cost and complexity.
                </div> */}
              </div>
            </div>

            {/* Decoder Visualization */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-center">Set Index Decoder</h4>
              <div className="flex flex-col items-center space-y-2">
                {getAddressPartition(config).setBits === 0 ? (
                  <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-500 font-medium text-sm">No decoder needed</span>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={DecoderSvg} 
                      alt={`${getAddressPartition(config).setBits}-to-${Math.pow(2, getAddressPartition(config).setBits)} Decoder`} 
                      className="w-32 h-32" 
                    />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-sm bg-white px-2 py-1 rounded border font-medium">
                      {getAddressPartition(config).setBits}-to-{Math.pow(2, getAddressPartition(config).setBits)}
                    </div>
                  </div>
                )}
                {/* <div className="text-center text-sm text-gray-600 max-w-sm">
                  {getAddressPartition(config).setBits === 0 
                    ? "Fully associative caches don't need set selection since there's only one set."
                    : "Converts set index bits into individual set selection lines. Complexity grows with the number of sets."
                  }
                </div> */}
              </div>
            </div>

            {/* Multiplexer Visualization */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-center">Data Output Multiplexer</h4>
              <div className="flex flex-col items-center space-y-2">
                {config.ways === 1 ? (
                  <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-500 font-medium text-sm">No MUX needed</span>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={MultiplexerSvg} 
                      alt={`${muxSize}-to-1 Multiplexer`} 
                      className="w-32 h-32" 
                    />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-sm bg-white px-2 py-1 rounded border font-medium">
                      {muxSize}-to-1 MUX
                    </div>
                  </div>
                )}
                {/* <div className="text-center text-sm text-gray-600 max-w-sm">
                  {config.ways === 1 
                    ? "Direct-mapped caches don't need a multiplexer since there's only one way per set."
                    : "Selects data from the matching way. Multiplexer size grows with associativity, increasing propagation delay and hardware cost."
                  }
                </div> */}
              </div>
            </div>
          </div>

          {/* Performance Impact */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Performance & Cost Trade-offs</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Access Time:</span>
                <span className={`font-medium ${config.ways === 1 ? 'text-green-600' : config.ways <= 2 ? 'text-lime-600' : config.ways <= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {config.ways === 1 ? 'Lowest' : config.ways <= 2 ? 'Low' : config.ways <= 4 ? 'Moderate' : 'Highest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Hardware Cost:</span>
                <span className={`font-medium ${config.ways === 1 ? 'text-green-600' : config.ways <= 2 ? 'text-lime-600' : config.ways <= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {config.ways === 1 ? 'Lowest' : config.ways <= 2 ? 'Low' : config.ways <= 4 ? 'Moderate' : 'Highest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Power Consumption:</span>
                <span className={`font-medium ${config.ways === 1 ? 'text-green-600' : config.ways <= 2 ? 'text-lime-600' : config.ways <= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {config.ways === 1 ? 'Lowest' : config.ways <= 2 ? 'Low' : config.ways <= 4 ? 'Moderate' : 'Highest'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Miss Rate:</span>
                <span className={`font-medium ${config.ways === 1 ? 'text-red-600' : config.ways <= 2 ? 'text-yellow-600' : config.ways <= 4 ? 'text-lime-600' : 'text-green-600'}`}>
                  {config.ways === 1 ? 'Highest' : config.ways <= 2 ? 'Moderate' : config.ways <= 4 ? 'Low' : 'Lowest'}
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {config.ways === 1 && "Direct-mapped caches are fastest but have the highest miss rates due to conflicts."}
              {config.ways > 1 && config.ways <= 2 && "Low associativity provides a good balance of performance and miss rate."}
              {config.ways > 2 && config.ways <= 4 && "Higher associativity reduces miss rates but increases access time and cost."}
              {config.ways > 4 && "Fully associative caches have the lowest miss rates but significant hardware overhead and slower access times."}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Associativity() {
  const [mode, setMode] = useState<string>("4-Way Set Associative");
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customConfig, setCustomConfig] = useState<CacheConfig>({
    ways: 4,
    cacheSize: CACHE_SIZE_KB,
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES
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
                  {/* Custom configuration in the future */}
                  {/* <SelectItem value="custom">Custom Configuration</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Cache Parameters</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Cache Size:</span>
                  <div className="text-blue-900">{Math.round(config.cacheSize * 1024)} bytes (8 words)</div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Block Size:</span>
                  <div className="text-blue-900">{getBlockSizeBytes(config)} bytes ({config.blockSizeWords} words)</div>
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
                Total cache blocks: {(config.cacheSize * 1024) / getBlockSizeBytes(config)} | 
                Address partition: {getAddressPartition(config).tagBits} tag + {getAddressPartition(config).setBits} set + {getAddressPartition(config).wordOffsetBits} word + {getAddressPartition(config).byteOffsetBits} byte bits
              </div>
            </div>

            {/* Custom Configuration Controls */}
            {useCustomConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cache Size: {Math.round(customConfig.cacheSize * 1024)} bytes (fixed)
                  </label>
                  <div className="text-xs text-gray-600">
                    Educational example uses 32-byte cache (8 words)
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Word Size: {customConfig.wordSize} bytes (fixed)
                  </label>
                  <div className="text-xs text-gray-600">
                    Standard 32-bit words
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Block Size: {customConfig.blockSizeWords} words ({getBlockSizeBytes(customConfig)} bytes)
                  </label>
                  <Slider
                    value={[customConfig.blockSizeWords]}
                    onValueChange={([value]) => updateCustomConfig('blockSizeWords', value)}
                    min={1}
                    max={4}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600">
                    Number of words pulled into cache per block
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
                    max={8}
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
                    <div>Total Blocks: {(customConfig.cacheSize * 1024) / getBlockSizeBytes(customConfig)}</div>
                    <div>Sets: {getNumSets(customConfig)}</div>
                    <div>Ways: {customConfig.ways}</div>
                    <div>Block Size: {getBlockSizeBytes(customConfig)} bytes</div>
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
        <HardwareComplexity config={config} />
      </div>
    </div>
  );
}
