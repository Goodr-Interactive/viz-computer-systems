import React, { useState, useEffect } from "react";
import { BinaryBlock, MultiColorBinaryBlock } from "./BinaryBlock";
import { SubsectionHeading } from "./SubsectionHeading";
import { TranslationSystem } from "../TranslationSystemNew"; // For toHex, toBinary
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  physicalPfnColor,
  physicalPfnBorder,
  physicalPfnColorHover,
  virtualOffsetColor,
  virtualOffsetBorder,
  virtualOffsetColorHover,
} from "../constants";

interface PhysicalAddressSystemInfo {
  pfnBits: number;
  offsetBits: number;
}

interface PhysicalAddressTranslationData {
  physicalAddress: number; // Actual physical address
  finalPfn: number | undefined; // Actual final PFN (undefined when no PTE clicked in test mode)
  virtualOffsetValue: number;
}

interface PhysicalAddressDisplayProps {
  systemInfo: PhysicalAddressSystemInfo;
  translationData: PhysicalAddressTranslationData;
  testMode: boolean;
  formatNumber: (num: number, padLength?: number) => string;

  // Test mode specific props
  userPhysicalAddressHex: string;
  setUserPhysicalAddressHex: (hex: string) => void;
  userOffsetBits: Array<0 | 1>;
  setUserOffsetBits: (bits: Array<0 | 1>) => void;
  validateUserAddressHex: () => boolean; // Function to validate the user's hex input
  virtualAddressForInputKey?: string; // To help with re-keying BinaryBlocks

  // Hex hint props
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

export const PhysicalAddressDisplay: React.FC<PhysicalAddressDisplayProps> = ({
  systemInfo,
  translationData,
  testMode,
  formatNumber,
  userPhysicalAddressHex,
  setUserPhysicalAddressHex,
  validateUserAddressHex,
  virtualAddressForInputKey,
  hexHintMode,
}) => {
  const totalPhysicalAddressBits = systemInfo.pfnBits + systemInfo.offsetBits;
  const hexInputLength = Math.ceil(totalPhysicalAddressBits / 4);

  // State to track hex inputs for each chunk
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({});

  // Reset hex inputs when hexHintMode changes or translation changes
  useEffect(() => {
    if (hexHintMode) {
      setHexInputs({});
    }
  }, [hexHintMode, virtualAddressForInputKey]);

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

  // Helper function to get the full physical address bits
  const getFullPhysicalAddressBits = (): string => {
    let pfnBits = "";
    let offsetBits = "";

    if (translationData.finalPfn !== undefined) {
      pfnBits = TranslationSystem.toBinary(translationData.finalPfn, systemInfo.pfnBits);
    } else {
      pfnBits = "_".repeat(systemInfo.pfnBits);
    }

    offsetBits = TranslationSystem.toBinary(
      translationData.virtualOffsetValue,
      systemInfo.offsetBits
    );

    return pfnBits + offsetBits;
  };

  // Helper function to get colors for each bit position (0 = rightmost bit)
  const getColorsForBitPosition = (
    bitPosition: number
  ): { color: string; borderColor: string; hoverColor: string } => {
    if (bitPosition < systemInfo.offsetBits) {
      // This is an offset bit
      return {
        color: virtualOffsetColor,
        borderColor: virtualOffsetBorder,
        hoverColor: virtualOffsetColorHover,
      };
    } else {
      // This is a PFN bit
      return {
        color: physicalPfnColor,
        borderColor: physicalPfnBorder,
        hoverColor: physicalPfnColorHover,
      };
    }
  };

  return (
    <section className="w-full max-w-7xl">
      <div className={`bg-muted/50 rounded-lg p-6`}>
        <SubsectionHeading className={`h-9 ${testMode ? "mb-5" : "mt-1"}`}>
          Physical Address ({totalPhysicalAddressBits} bits):{" "}
          {testMode ? (
            <span className="inline-flex items-center gap-1">
              0x
              <Input
                type="text"
                value={userPhysicalAddressHex}
                onChange={(e) =>
                  setUserPhysicalAddressHex(
                    e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase()
                  )
                }
                className="mt-1 h-8 max-w-20 px-2 font-mono text-sm"
                placeholder={Array(hexInputLength).fill("0").join("")}
                maxLength={hexInputLength}
              />
              {userPhysicalAddressHex && userPhysicalAddressHex.length === hexInputLength && (
                <span className="mt-1 ml-1">
                  {validateUserAddressHex() ? (
                    <Check className="text-green-600" size={20} />
                  ) : (
                    <X className="text-red-600" size={20} />
                  )}
                </span>
              )}
            </span>
          ) : (
            TranslationSystem.toHex(
              translationData.physicalAddress,
              Math.ceil(totalPhysicalAddressBits / 4)
            )
          )}
        </SubsectionHeading>

        {!hexHintMode ? (
          <div className="flex items-center justify-center gap-2">
            {testMode ? (
              <>
                <BinaryBlock
                  key={`pa-pfn-test-${virtualAddressForInputKey}`} // Use a key that changes with translation
                  blocks={systemInfo.pfnBits}
                  digits={
                    translationData.finalPfn !== undefined
                      ? TranslationSystem.toBinary(
                          translationData.finalPfn,
                          systemInfo.pfnBits
                        ).split("")
                      : Array(systemInfo.pfnBits).fill("_")
                  }
                  color={physicalPfnColor}
                  borderColor={physicalPfnBorder}
                  hoverColor={physicalPfnColorHover}
                  label="PFN"
                  showBitNumbers={true}
                  showLeftBorder={true}
                  startBitNumber={systemInfo.offsetBits}
                />
                <BinaryBlock
                  key="pa-offset-test"
                  blocks={systemInfo.offsetBits}
                  digits={TranslationSystem.toBinary(
                    translationData.virtualOffsetValue, // Use the offset value directly
                    systemInfo.offsetBits
                  ).split("")}
                  color={virtualOffsetColor}
                  borderColor={virtualOffsetBorder}
                  hoverColor={virtualOffsetColorHover}
                  label="Offset"
                  showBitNumbers={true}
                  showLeftBorder={true}
                  startBitNumber={0}
                />
              </>
            ) : (
              <>
                <BinaryBlock
                  key="pa-pfn"
                  blocks={systemInfo.pfnBits}
                  digits={
                    translationData.finalPfn !== undefined
                      ? TranslationSystem.toBinary(
                          translationData.finalPfn,
                          systemInfo.pfnBits
                        ).split("")
                      : Array(systemInfo.pfnBits).fill("")
                  }
                  color={physicalPfnColor}
                  borderColor={physicalPfnBorder}
                  hoverColor={physicalPfnColorHover}
                  label={`PFN${translationData.finalPfn !== undefined ? ` (${formatNumber(translationData.finalPfn)})` : ""}`}
                  showBitNumbers={true}
                  showLeftBorder={true}
                  startBitNumber={systemInfo.offsetBits}
                  tooltip={
                    testMode ? undefined : (
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">
                          Physical Frame Number ({systemInfo.pfnBits} bits)
                        </p>
                        <p className="text-xs">
                          Identifies which physical memory frame contains the page data. Comes from
                          the PTE.
                        </p>
                      </div>
                    )
                  }
                />
                <BinaryBlock
                  key="pa-offset"
                  blocks={systemInfo.offsetBits}
                  digits={TranslationSystem.toBinary(
                    translationData.virtualOffsetValue, // Use the passed virtual offset value
                    systemInfo.offsetBits
                  ).split("")}
                  color={virtualOffsetColor}
                  borderColor={virtualOffsetBorder}
                  hoverColor={virtualOffsetColorHover}
                  label={`Offset (${formatNumber(translationData.virtualOffsetValue)})`}
                  showBitNumbers={true}
                  showLeftBorder={true}
                  startBitNumber={0}
                  tooltip={
                    testMode ? undefined : (
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">
                          Page Offset ({systemInfo.offsetBits} bits)
                        </p>
                        <p className="text-xs">
                          Byte position within the page. Copied directly to physical address without
                          translation.
                        </p>
                      </div>
                    )
                  }
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {(() => {
                const fullBits = getFullPhysicalAddressBits();
                const chunks = splitIntoHexChunks(fullBits);

                return chunks.map((chunk, chunkIndex) => {
                  const chunkKey = `pa-chunk-${chunkIndex}`;
                  const expectedHex = binaryToHex(chunk);
                  const userInput = hexInputs[chunkKey] || "";
                  const isCorrect = isHexInputCorrect(chunkKey, expectedHex);

                  // Calculate bit positions for this chunk (from right to left, 0-indexed)
                  const chunkStartBit = (chunks.length - 1 - chunkIndex) * 4;

                  // Get colors for each bit in this 4-bit chunk
                  const colors = [];
                  const borderColors = [];
                  const hoverColors = [];

                  for (let i = 0; i < 4; i++) {
                    const bitPosition = chunkStartBit + (3 - i); // 3-i because we want left-to-right ordering
                    const colorInfo = getColorsForBitPosition(bitPosition);
                    colors.push(colorInfo.color);
                    borderColors.push(colorInfo.borderColor);
                    hoverColors.push(colorInfo.hoverColor);
                  }

                  return (
                    <div key={chunkKey} className="flex flex-col items-center gap-1">
                      {/* Hex input field */}
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
                      {/* 4-bit multi-color binary block */}
                      <MultiColorBinaryBlock
                        blocks={4}
                        digits={chunk.split("")}
                        colors={colors}
                        borderColors={borderColors}
                        hoverColors={hoverColors}
                        showBitNumbers={false}
                        showLeftBorder={true}
                      />
                    </div>
                  );
                });
              })()}
            </div>
            <div className="text-muted-foreground flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 ${physicalPfnColor} ${physicalPfnBorder} border`}></div>
                <span>PFN ({systemInfo.pfnBits} bits)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 ${virtualOffsetColor} ${virtualOffsetBorder} border`}
                ></div>
                <span>Offset ({systemInfo.offsetBits} bits)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
