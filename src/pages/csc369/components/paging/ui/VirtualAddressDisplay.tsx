import React from "react";
import { BinaryBlock } from "./BinaryBlock";
import { SubsectionHeading } from "./SubsectionHeading";
import { PageTableLevelColors } from "../constants";
import { TranslationSystem, type PageTableLevel } from "../TranslationSystem"; // Assuming types can be imported

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
  pageTableLevels: PageTableLevel[]; // For tooltip logic
}

export const VirtualAddressDisplay: React.FC<VirtualAddressDisplayProps> = ({
  virtualAddress,
  totalVirtualAddressBits,
  virtualAddressIndices, // Updated prop name
  virtualAddressOffset, // Updated prop name
  testMode,
  formatNumber,
  pageTableLevels,
}) => {
  return (
    <section className="w-full max-w-6xl">
      <div className="bg-muted/50 rounded-lg p-6">
        <SubsectionHeading>
          Virtual Address ({totalVirtualAddressBits} bits):{" "}
          {TranslationSystem.toHex(virtualAddress, 4)}
        </SubsectionHeading>
        <div className="flex items-center justify-center gap-2">
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
              showLeftBorder={true}
              startBitNumber={level.startBit}
              tooltip={
                testMode ? undefined : (
                  <div className="max-w-sm space-y-1">
                    <p className="text-sm font-medium">
                      {level.label} ({level.bits.length} bits)
                    </p>
                    <p className="text-xs">
                      {i === pageTableLevels.length - 1
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
            showLeftBorder={true}
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
      </div>
    </section>
  );
};
