import React, { useState, useEffect } from "react";
import { BinaryBlock, MultiColorBinaryBlock } from "./BinaryBlock";
import { SubsectionHeading } from "./SubsectionHeading";
import { TranslationSystem } from "../TranslationSystemNew"; // For toHex, toBinary
import { PageTableLevelColors } from "../constants";
import { Check, X } from "lucide-react";
// import type { PageTableLevel } from "../TranslationSystemNew"; // No longer needed

// We need to replicate or import the structure of breakdown and vaBitCalculations
// For now, defining simplified interfaces. These should ideally come from a shared types file.
interface VirtualAddressLevel {
  bits: string;
  value: number;
  label: string;
  startBit: number;
}

interface VirtualAddressOffset {
  bits: string;
  value: number;
}

interface VirtualAddressDisplayProps {
  virtualAddress: number; // For the main heading
  totalVirtualAddressBits: number; // For the main heading
  virtualAddressIndices: VirtualAddressLevel[]; // Changed from breakdown to be more specific
  virtualAddressOffset: VirtualAddressOffset; // Changed from breakdown to be more specific
  testMode: boolean;
  formatNumber: (num: number, padLength?: number) => string;
  pageTableLevels: number; // For tooltip logic - This is now a number
  hexHintMode: boolean;
  setHexHintMode: (value: boolean) => void;
}

// Helper function to split bits into 4-bit chunks with padding
const splitIntoHexChunks = (bits: string) => {
  // Pad to next multiple of 4
  const paddedLength = Math.ceil(bits.length / 4) * 4;
  const paddedBits = bits.padStart(paddedLength, "0");

  // Split into chunks of 4
  const chunks = [];
  for (let i = 0; i < paddedBits.length; i += 4) {
    chunks.push(paddedBits.slice(i, i + 4));
  }
  return chunks;
};

// Helper function to convert 4-bit binary string to hex
const binaryToHex = (binaryChunk: string): string => {
  const decimal = parseInt(binaryChunk, 2);
  return decimal.toString(16).toUpperCase();
};

export const VirtualAddressDisplay: React.FC<VirtualAddressDisplayProps> = ({
  virtualAddress,
  totalVirtualAddressBits,
  virtualAddressIndices, // Updated prop name
  virtualAddressOffset, // Updated prop name
  testMode,
  formatNumber,
  pageTableLevels,
  hexHintMode,
}) => {
  // State to track hex inputs for each chunk
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({});

  // Reset hex inputs when hexHintMode changes or virtualAddress changes
  useEffect(() => {
    if (hexHintMode) {
      setHexInputs({});
    }
  }, [hexHintMode, virtualAddress]);

  // Handle hex input change
  const handleHexInputChange = (chunkKey: string, value: string) => {
    const filteredValue = value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    if (filteredValue.length <= 1) {
      setHexInputs((prev) => ({
        ...prev,
        [chunkKey]: filteredValue,
      }));
    }
  };

  // Check if hex input is correct
  const isHexInputCorrect = (chunkKey: string, expectedHex: string): boolean => {
    return hexInputs[chunkKey] === expectedHex;
  };

  return (
    <section className="w-full max-w-7xl overflow-x-auto">
      <div className="bg-muted/50 min-w-fit rounded-lg p-6">
        <SubsectionHeading>
          Virtual Address ({totalVirtualAddressBits} bits):{" "}
          {TranslationSystem.toHex(virtualAddress, 4)}
        </SubsectionHeading>

        {!hexHintMode ? (
          <div className="flex min-w-fit items-center justify-center gap-2 overflow-x-auto">
            {virtualAddressIndices.map((level, i) => (
              <BinaryBlock
                key={`va-level-${i}`}
                blocks={level.bits.length}
                digits={level.bits.split("")}
                color={PageTableLevelColors[i % PageTableLevelColors.length].background}
                borderColor={PageTableLevelColors[i % PageTableLevelColors.length].border}
                hoverColor={PageTableLevelColors[i % PageTableLevelColors.length].hover}
                label={testMode ? level.label : `${level.label} (${formatNumber(level.value)})`}
                showBitNumbers={true}
                startBitNumber={level.startBit}
                tooltip={
                  testMode ? undefined : (
                    <div className="max-w-sm space-y-1">
                      <p className="text-sm font-medium">
                        {level.label} ({level.bits.length} bits)
                      </p>
                      <p className="text-xs">
                        {i === pageTableLevels - 1
                          ? "Indexes into the final page table to find the physical frame number."
                          : `Indexes into page directory level ${i} to find the next page table.`}
                      </p>
                    </div>
                  )
                }
              />
            ))}
            <BinaryBlock
              key="va-offset"
              blocks={virtualAddressOffset.bits.length}
              digits={virtualAddressOffset.bits.split("")}
              color="bg-emerald-100"
              borderColor="border-emerald-300"
              hoverColor="group-hover:bg-emerald-200"
              label={testMode ? "Offset" : `Offset (${formatNumber(virtualAddressOffset.value)})`}
              showBitNumbers={true}
              startBitNumber={0}
              tooltip={
                testMode ? undefined : (
                  <div className="max-w-sm space-y-1">
                    <p className="text-sm font-medium">
                      Page Offset ({virtualAddressOffset.bits.length} bits)
                    </p>
                    <p className="text-xs">
                      Byte position within the page. Copied directly to physical address without
                      translation.
                    </p>
                  </div>
                )
              }
            />
          </div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            <div className="w-full overflow-x-auto">
              <div
                className="flex min-w-fit flex-nowrap items-center justify-start gap-2"
                style={{ margin: "0 auto", width: "max-content" }}
              >
                {virtualAddressIndices.map((level, i) => {
                  const chunks = splitIntoHexChunks(level.bits);
                  return (
                    <div
                      key={`va-level-chunks-${i}`}
                      className="flex flex-shrink-0 flex-col items-center gap-2"
                    >
                      <div className="flex gap-1">
                        {chunks.map((chunk, chunkIndex) => {
                          const chunkKey = `level-${i}-chunk-${chunkIndex}`;
                          const expectedHex = binaryToHex(chunk);
                          const userInput = hexInputs[chunkKey] || "";
                          const isCorrect = isHexInputCorrect(chunkKey, expectedHex);

                          // Calculate padding for this chunk
                          const originalBitsLength = level.bits.length;
                          const paddedBitsLength = chunks.length * 4;
                          const paddingBitsCount = paddedBitsLength - originalBitsLength;

                          // Create colors and padding arrays for this chunk
                          const colors = [];
                          const borderColors = [];
                          const hoverColors = [];
                          const isPadding = [];

                          for (let j = 0; j < 4; j++) {
                            const globalBitIndex = chunkIndex * 4 + j;
                            const isThisBitPadding = globalBitIndex < paddingBitsCount;

                            if (isThisBitPadding) {
                              // Use table styling for padding bits
                              colors.push("bg-muted/50");
                              borderColors.push("border-border");
                              hoverColors.push("");
                              isPadding.push(true);
                            } else {
                              // Use level-specific colors for data bits
                              colors.push(
                                PageTableLevelColors[i % PageTableLevelColors.length].background
                              );
                              borderColors.push(
                                PageTableLevelColors[i % PageTableLevelColors.length].border
                              );
                              hoverColors.push(
                                PageTableLevelColors[i % PageTableLevelColors.length].hover
                              );
                              isPadding.push(false);
                            }
                          }

                          return (
                            <div key={chunkKey} className="flex flex-col items-center gap-1">
                              {/* Hex input field with icon */}
                              <div className="relative flex justify-center">
                                <input
                                  type="text"
                                  value={userInput}
                                  onChange={(e) => handleHexInputChange(chunkKey, e.target.value)}
                                  className={`h-6 w-8 rounded border text-center font-mono text-xs focus:outline-none ${
                                    userInput
                                      ? isCorrect
                                        ? "border-green-500 focus:border-green-600"
                                        : "border-red-500 focus:border-red-600"
                                      : "border-gray-300 focus:border-blue-500"
                                  }`}
                                  placeholder="?"
                                  maxLength={1}
                                />
                                {userInput && (
                                  <div className="absolute top-0 left-full ml-1.5 flex h-6 items-center">
                                    {isCorrect ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* 4-bit multi-color binary block */}
                              <MultiColorBinaryBlock
                                blocks={4}
                                digits={chunk.split("")}
                                colors={colors}
                                borderColors={borderColors}
                                hoverColors={hoverColors}
                                isPadding={isPadding}
                                showBitNumbers={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-muted-foreground text-sm">{level.label}</div>
                    </div>
                  );
                })}
                {(() => {
                  const offsetChunks = splitIntoHexChunks(virtualAddressOffset.bits);
                  return (
                    <div className="flex flex-shrink-0 flex-col items-center gap-2">
                      <div className="flex gap-1">
                        {offsetChunks.map((chunk, chunkIndex) => {
                          const chunkKey = `offset-chunk-${chunkIndex}`;
                          const expectedHex = binaryToHex(chunk);
                          const userInput = hexInputs[chunkKey] || "";
                          const isCorrect = isHexInputCorrect(chunkKey, expectedHex);

                          // Calculate padding for offset chunk
                          const originalBitsLength = virtualAddressOffset.bits.length;
                          const paddedBitsLength = offsetChunks.length * 4;
                          const paddingBitsCount = paddedBitsLength - originalBitsLength;

                          // Create colors and padding arrays for this chunk
                          const colors = [];
                          const borderColors = [];
                          const hoverColors = [];
                          const isPadding = [];

                          for (let j = 0; j < 4; j++) {
                            const globalBitIndex = chunkIndex * 4 + j;
                            const isThisBitPadding = globalBitIndex < paddingBitsCount;

                            if (isThisBitPadding) {
                              // Use table styling for padding bits
                              colors.push("bg-muted/50");
                              borderColors.push("border-border");
                              hoverColors.push("");
                              isPadding.push(true);
                            } else {
                              // Use offset colors for data bits
                              colors.push("bg-emerald-100");
                              borderColors.push("border-emerald-300");
                              hoverColors.push("group-hover:bg-emerald-200");
                              isPadding.push(false);
                            }
                          }

                          return (
                            <div key={chunkKey} className="flex flex-col items-center gap-1">
                              {/* Hex input field with icon */}
                              <div className="relative flex justify-center">
                                <input
                                  type="text"
                                  value={userInput}
                                  onChange={(e) => handleHexInputChange(chunkKey, e.target.value)}
                                  className={`h-6 w-8 rounded border text-center font-mono text-xs focus:outline-none ${
                                    userInput
                                      ? isCorrect
                                        ? "border-green-500 focus:border-green-600"
                                        : "border-red-500 focus:border-red-600"
                                      : "border-gray-300 focus:border-blue-500"
                                  }`}
                                  placeholder="?"
                                  maxLength={1}
                                />
                                {userInput && (
                                  <div className="absolute top-0 left-full ml-1.5 flex h-6 items-center">
                                    {isCorrect ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* 4-bit multi-color binary block */}
                              <MultiColorBinaryBlock
                                blocks={4}
                                digits={chunk.split("")}
                                colors={colors}
                                borderColors={borderColors}
                                hoverColors={hoverColors}
                                isPadding={isPadding}
                                showBitNumbers={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-muted-foreground text-sm">Offset</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
