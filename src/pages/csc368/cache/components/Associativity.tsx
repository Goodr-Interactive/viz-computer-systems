import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BinaryBlock } from "./BinaryBlock";
// Import the SVG assets for hardware visualization
import ComparatorSvg from "@/assets/comparator.svg";
import MultiplexerSvg from "@/assets/mux.svg";
import AssociativitySvg from "@/assets/associativity-direct-2-words.svg";
import FourWaySetAssociativeSvg from "@/assets/associativity-direct-4-ways.svg";
import TwoWaySetAssociativeSvg from "@/assets/associativity-direct-2-ways.svg";
import FullyAssociativeSvg from "@/assets/associativity-direct-8-ways.svg";

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
    wordSize: WORD_SIZE_BYTES,
  },
  "Direct-Mapped (1-way, 2 words)": {
    ways: 1,
    cacheSize: CACHE_SIZE_KB,
    blockSizeWords: 2,
    wordSize: WORD_SIZE_BYTES,
  },
  "2-Way Set Associative": {
    ways: 2,
    cacheSize: CACHE_SIZE_KB,
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES,
  },
  "4-Way Set Associative": {
    ways: 4,
    cacheSize: CACHE_SIZE_KB,
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES,
  },
  "Fully Associative": {
    ways: 8, // All 8 words in one set
    cacheSize: CACHE_SIZE_KB,
    blockSizeWords: DEFAULT_BLOCK_SIZE_WORDS,
    wordSize: WORD_SIZE_BYTES,
  },
};

function getBlockSizeBytes(config: CacheConfig): number {
  return config.blockSizeWords * config.wordSize;
}

function getAddressPartition(config: CacheConfig): {
  tagBits: number;
  setBits: number;
  offsetBits: number;
  wordOffsetBits: number;
  byteOffsetBits: number;
} {
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
  const { tagBits, setBits, offsetBits, wordOffsetBits, byteOffsetBits } =
    getAddressPartition(config);

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
    <div className="w-full space-y-4">
      <h3 className="text-center text-lg font-medium">Memory Address (32 bits)</h3>

      <div className="flex items-start justify-center gap-0">
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
                <p className="text-xs">Determines which set in the cache to access.</p>
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
    <div className="w-full space-y-4">
      {/* <h3 className="text-lg font-medium text-center">
        Cache Structure ({numSets} sets × {config.ways} ways)
        {showTruncated && <span className="text-sm text-gray-500 block">Showing first {maxDisplaySets} sets</span>}
      </h3> */}

      <div className="flex justify-center">
        <div className="inline-block max-w-full overflow-x-auto rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
          {/* Header row with way labels */}
          <div
            className="mb-2 grid gap-2"
            style={{ gridTemplateColumns: `60px repeat(${Math.min(config.ways, 8)}, 80px)` }}
          >
            <div></div> {/* Empty cell for set labels column */}
            {[...Array(Math.min(config.ways, 8))].map((_, w) => (
              <div
                key={`way-header-${w}`}
                className="text-center text-sm font-medium text-gray-600"
              >
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
            <div
              key={`set-${s}`}
              className="mb-2 grid gap-2"
              style={{ gridTemplateColumns: `60px repeat(${Math.min(config.ways, 8)}, 80px)` }}
            >
              {/* Set label */}
              <div className="flex items-center justify-center text-sm font-medium text-gray-700">
                Set {s}
              </div>

              {/* Cache blocks for this set */}
              {[...Array(Math.min(config.ways, 8))].map((_, w) => (
                <div
                  key={`s${s}w${w}`}
                  className="flex h-9 items-center justify-center rounded border-2 border-sky-500 bg-sky-100 text-xs font-medium text-gray-700 transition-colors hover:bg-sky-200"
                >
                  Block
                </div>
              ))}
              {config.ways > 8 && (
                <div className="flex h-9 items-center justify-center text-xs text-gray-500">
                  ...
                </div>
              )}
            </div>
          ))}

          {showTruncated && (
            <div className="mt-2 text-center text-sm text-gray-500">
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

  // Get the appropriate SVG for the current configuration
  const getAssociativitySvg = (config: CacheConfig) => {
    const key = `${config.ways}-way-${config.blockSizeWords}-word`;

    // TODO: Add more SVGs as they become available
    const svgMap: Record<string, string> = {
      "1-way-2-word": AssociativitySvg, // Currently available: direct-mapped with 2 words
      // Add placeholders for future SVGs:
      // "1-way-1-word": DirectMapped1WordSvg,
      "2-way-1-word": TwoWaySetAssociativeSvg,
      "4-way-1-word": FourWaySetAssociativeSvg,
      "8-way-1-word": FullyAssociativeSvg,
    };

    return svgMap[key] || null;
  };

  const currentSvg = getAssociativitySvg(config);

  // Transistor count estimation (rough calculation)
  const transistorsPerComparator = 32 * 6; // ~6 transistors per bit comparison (XNOR gate)
  const transistorsPerMux = config.ways > 1 ? config.ways * 4 + 8 : 0; // Transmission gates + control logic
  const transistorsPerAndGate = 6; // NAND gate (4) + inverter (2)
  const transistorsPerOrGate = 6; // NOR gate (4) + inverter (2)

  const totalComparatorTransistors = numComparators * transistorsPerComparator;
  const totalMuxTransistors = config.ways > 1 ? transistorsPerMux : 0;
  const totalLogicGateTransistors =
    config.ways * transistorsPerAndGate + // AND gates for hit detection
    (config.ways > 1 ? transistorsPerOrGate : 0); // OR gate for final hit signal

  const totalTransistors =
    totalComparatorTransistors + totalMuxTransistors + totalLogicGateTransistors;

  return (
    <div className="space-y-4">
      {/* Hardware Layout */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="relative w-full max-w-3xl">
            {currentSvg ? (
              <img
                src={currentSvg}
                alt={`${config.ways}-way cache hardware diagram`}
                className="h-auto w-full rounded-lg border border-gray-300 shadow-md"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="mb-1 text-sm font-medium">Hardware Diagram</div>
                  <div className="text-xs">
                    {config.ways}-way, {config.blockSizeWords}-word block
                  </div>
                  <div className="mt-1 text-xs italic">(SVG coming soon)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Tag Comparators */}
        <div className="space-y-3">
          <h4 className="text-center text-sm font-medium">Tag Comparators</h4>
          <div className="flex flex-col items-center space-y-2">
            <div className="flex max-w-sm flex-wrap justify-center gap-1">
              {[...Array(Math.min(numComparators, 4))].map((_, i) => (
                <div key={i} className="relative">
                  <img src={ComparatorSvg} alt={`Comparator ${i + 1}`} className="h-8 w-8" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 transform rounded border bg-white px-1 text-xs">
                    {i + 1}
                  </div>
                </div>
              ))}
              {numComparators > 4 && (
                <div className="flex items-center text-xs text-gray-500">+{numComparators - 4}</div>
              )}
            </div>
            <div className="text-center text-xs text-gray-600">
              {numComparators} × 32-bit comparators
            </div>
          </div>
        </div>

        {/* Multiplexer */}
        <div className="space-y-3">
          <h4 className="text-center text-sm font-medium">Data Multiplexer</h4>
          <div className="flex flex-col items-center space-y-2">
            {config.ways === 1 ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <span className="text-xs font-medium text-gray-500">No MUX</span>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={MultiplexerSvg}
                  alt={`${muxSize}-to-1 Multiplexer`}
                  className="h-16 w-16"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 transform rounded border bg-white px-1 text-xs">
                  {muxSize}:1
                </div>
              </div>
            )}
            <div className="text-center text-xs text-gray-600">
              {config.ways === 1 ? "Direct connection" : `${muxSize}-to-1 MUX`}
            </div>
          </div>
        </div>

        {/* AND/OR Gates */}
        <div className="space-y-3">
          <h4 className="text-center text-sm font-medium">Logic Gates</h4>
          <div className="flex flex-col items-center space-y-2">
            <div className="space-y-1">
              {/* AND Gates */}
              <div className="flex items-center justify-center gap-1">
                {[...Array(Math.min(config.ways, 4))].map((_, i) => (
                  <div
                    key={`and-${i}`}
                    className="flex h-4 w-4 items-center justify-center rounded border border-green-400 bg-green-200 text-xs font-bold"
                  >
                    &
                  </div>
                ))}
                {config.ways > 4 && (
                  <span className="text-xs text-gray-500">+{config.ways - 4}</span>
                )}
              </div>
              {/* OR Gate */}
              {config.ways > 1 && (
                <div className="flex justify-center">
                  <div className="flex h-4 w-6 items-center justify-center rounded border border-blue-400 bg-blue-200 text-xs font-bold">
                    OR
                  </div>
                </div>
              )}
            </div>
            <div className="text-center text-xs text-gray-600">
              {config.ways} AND + {config.ways > 1 ? "1 OR" : "0 OR"}
            </div>
          </div>
        </div>
      </div>
      {/* Hardware Summary */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <h4 className="mb-2 text-sm font-medium text-blue-900">Hardware Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
          <div>
            <span className="font-medium text-blue-700">Comparators:</span>
            <div className="text-blue-900">{numComparators} units</div>
          </div>
          <div>
            <span className="font-medium text-blue-700">Multiplexers:</span>
            <div className="text-blue-900">{config.ways === 1 ? "0" : "1"} units</div>
          </div>
          <div>
            <span className="font-medium text-blue-700">Logic Gates:</span>
            <div className="text-blue-900">{config.ways + (config.ways > 1 ? 1 : 0)} gates</div>
          </div>
          <div>
            <span className="font-medium text-blue-700">Transistors:</span>
            <div className="text-blue-900">~{totalTransistors.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Breakdown: {totalComparatorTransistors.toLocaleString()} (comparators) +{" "}
          {totalMuxTransistors} (mux) + {totalLogicGateTransistors} (gates)
        </div>
      </div>
    </div>
  );
}

export default function Associativity() {
  const [mode, setMode] = useState<string>("4-Way Set Associative");

  const config: CacheConfig = cacheModes[mode];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-2">
      {/* Top Section: 2 columns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Top Left: Configuration Panel */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cache Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration Mode:</label>
              <Select
                value={mode}
                onValueChange={(value) => {
                  setMode(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cacheModes).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configuration Summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h4 className="mb-2 text-xs font-medium text-blue-900">Cache Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-blue-700">Cache Size:</span>
                  <div className="text-blue-900">{Math.round(config.cacheSize * 1024)} bytes</div>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Block Size:</span>
                  <div className="text-blue-900">{getBlockSizeBytes(config)} bytes</div>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Total Sets:</span>
                  <div className="text-blue-900">{getNumSets(config)}</div>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Ways per Set:</span>
                  <div className="text-blue-900">{config.ways}</div>
                </div>
              </div>
            </div>
            <CacheArray config={config} />
          </CardContent>
        </Card>

        {/* Top Right: Hardware Analysis */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hardware Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <HardwareComplexity config={config} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Memory Address - Full Width */}
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Memory Address (32 bits)</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressField config={config} />
        </CardContent>
      </Card>
    </div>
  );
}
