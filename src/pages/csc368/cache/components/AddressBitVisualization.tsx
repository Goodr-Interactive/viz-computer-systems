import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface AddressBitVisualizationProps {
  config: CacheHierarchyConfig;
}

export const AddressBitVisualization: React.FC<AddressBitVisualizationProps> = ({ config }) => {
  const [sampleAddress, setSampleAddress] = useState("0x12345678");
  const [addressBits, setAddressBits] = useState(32);

  const calculateSets = (cacheConfig: CacheConfig) => {
    const totalBlocks = (cacheConfig.size * 1024) / cacheConfig.blockSize;
    return totalBlocks / cacheConfig.associativity;
  };

  const calculateIndexBits = (cacheConfig: CacheConfig) => {
    const sets = calculateSets(cacheConfig);
    return Math.log2(sets);
  };

  const calculateOffsetBits = (cacheConfig: CacheConfig) => {
    return Math.log2(cacheConfig.blockSize);
  };

  const calculateTagBits = (cacheConfig: CacheConfig) => {
    const indexBits = calculateIndexBits(cacheConfig);
    const offsetBits = calculateOffsetBits(cacheConfig);
    return addressBits - indexBits - offsetBits;
  };

  const parseAddress = (address: string) => {
    try {
      // Remove 0x prefix if present and convert to number
      const cleanAddress = address.replace(/^0x/i, "");
      const addressValue = parseInt(cleanAddress, 16);
      return addressValue;
    } catch {
      return 0;
    }
  };

  const extractAddressBits = (address: number, cacheConfig: CacheConfig) => {
    const offsetBits = calculateOffsetBits(cacheConfig);
    const indexBits = calculateIndexBits(cacheConfig);
    const tagBits = calculateTagBits(cacheConfig);

    const offset = address & ((1 << offsetBits) - 1);
    const index = (address >> offsetBits) & ((1 << indexBits) - 1);
    const tag = (address >> (offsetBits + indexBits)) & ((1 << tagBits) - 1);

    return { tag, index, offset, offsetBits, indexBits, tagBits };
  };

  const renderAddressBits = (cacheConfig: CacheConfig, level: string, color: string) => {
    if (!cacheConfig.enabled) return null;

    const addressValue = parseAddress(sampleAddress);
    const { tag, index, offset, offsetBits, indexBits, tagBits } = extractAddressBits(
      addressValue,
      cacheConfig
    );

    return (
      <Card key={level} className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded ${color}`} />
            {level} Cache Address Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Tag bits:</strong> {tagBits}
            </div>
            <div>
              <strong>Index bits:</strong> {indexBits}
            </div>
            <div>
              <strong>Offset bits:</strong> {offsetBits}
            </div>
          </div>

          {/* Binary representation */}
          <div className="space-y-2">
            <Label>Binary Address Breakdown:</Label>
            <div className="bg-muted overflow-x-auto rounded border p-3 font-mono text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">31</span>
                <span className="text-muted-foreground flex-1 text-center">...</span>
                <span className="text-muted-foreground">{offsetBits + indexBits}</span>
                <span className="text-muted-foreground">{offsetBits}</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <div className="flex border-t pt-1">
                <span
                  className="border border-red-300 bg-red-100 px-2 py-1"
                  style={{ width: `${(tagBits / addressBits) * 100}%` }}
                >
                  Tag ({tagBits} bits)
                </span>
                <span
                  className="border border-blue-300 bg-blue-100 px-2 py-1"
                  style={{ width: `${(indexBits / addressBits) * 100}%` }}
                >
                  Index ({indexBits} bits)
                </span>
                <span
                  className="border border-green-300 bg-green-100 px-2 py-1"
                  style={{ width: `${(offsetBits / addressBits) * 100}%` }}
                >
                  Offset ({offsetBits} bits)
                </span>
              </div>
            </div>
          </div>

          {/* Extracted values */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded bg-red-50 p-3">
              <div className="font-semibold text-red-700">Tag</div>
              <div className="text-sm">Decimal: {tag}</div>
              <div className="font-mono text-sm">Hex: 0x{tag.toString(16).toUpperCase()}</div>
              <div className="font-mono text-sm">
                Binary: {tag.toString(2).padStart(tagBits, "0")}
              </div>
            </div>
            <div className="rounded bg-blue-50 p-3">
              <div className="font-semibold text-blue-700">Index (Set)</div>
              <div className="text-sm">Decimal: {index}</div>
              <div className="font-mono text-sm">Hex: 0x{index.toString(16).toUpperCase()}</div>
              <div className="font-mono text-sm">
                Binary: {index.toString(2).padStart(indexBits, "0")}
              </div>
            </div>
            <div className="rounded bg-green-50 p-3">
              <div className="font-semibold text-green-700">Offset</div>
              <div className="text-sm">Decimal: {offset}</div>
              <div className="font-mono text-sm">Hex: 0x{offset.toString(16).toUpperCase()}</div>
              <div className="font-mono text-sm">
                Binary: {offset.toString(2).padStart(offsetBits, "0")}
              </div>
            </div>
          </div>

          {/* Cache mapping information */}
          <div className="bg-muted rounded p-3">
            <h4 className="mb-2 font-semibold">Cache Mapping:</h4>
            <div className="space-y-1 text-sm">
              <div>
                • This address maps to <strong>Set {index}</strong> in the {level} cache
              </div>
              <div>
                • The cache set has <strong>{cacheConfig.associativity}</strong> way(s)
              </div>
              <div>
                • Block size is <strong>{cacheConfig.blockSize}</strong> bytes
              </div>
              <div>
                • The tag <strong>0x{tag.toString(16).toUpperCase()}</strong> is used to identify
                the specific block
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Address Bit Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Memory Address (hex)</Label>
              <Input
                id="address"
                value={sampleAddress}
                onChange={(e) => setSampleAddress(e.target.value)}
                placeholder="0x12345678"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="address-bits">Address Width (bits)</Label>
              <Input
                id="address-bits"
                type="number"
                value={addressBits}
                onChange={(e) => setAddressBits(parseInt(e.target.value) || 32)}
                min="16"
                max="64"
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold">How Address Bits Work:</h4>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <strong>Tag bits:</strong> Identify which block is stored in a cache set
              </li>
              <li>
                <strong>Index bits:</strong> Determine which cache set to check
              </li>
              <li>
                <strong>Offset bits:</strong> Specify the byte within a cache block
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {config.l1.enabled && renderAddressBits(config.l1, "L1", "bg-blue-400")}
        {config.l2.enabled && renderAddressBits(config.l2, "L2", "bg-green-500")}
        {config.l3.enabled && renderAddressBits(config.l3, "L3", "bg-yellow-500")}
      </div>

      {!config.l1.enabled && !config.l2.enabled && !config.l3.enabled && (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-center">
            Enable at least one cache level to see address bit breakdown.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
