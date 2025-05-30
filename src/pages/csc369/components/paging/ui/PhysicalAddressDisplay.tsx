import React from "react";
import { BinaryBlock } from "./BinaryBlock";
import { InputBinaryBlock } from "./InputBinaryBlock";
import { SubsectionHeading } from "./SubsectionHeading";
import { TranslationSystem } from "../TranslationSystem"; // For toHex, toBinary
import { Check, X } from "lucide-react";

// Assuming these color constants are either passed as props or defined/imported here
// For now, hardcoding for simplicity, mirroring TranslationExample
const physicalPfnColor = "bg-sky-100";
const physicalPfnBorder = "border-sky-300";
const physicalPfnColorHover = "group-hover:bg-sky-200";

const virtualOffsetColor = "bg-emerald-100";
const virtualOffsetBorder = "border-emerald-300";
const virtualOffsetColorHover = "group-hover:bg-emerald-200";

interface PhysicalAddressSystemInfo {
  pfnBits: number;
  offsetBits: number;
}

interface PhysicalAddressTranslationData {
  physicalAddress: number; // Actual physical address
  finalPfn: number; // Actual final PFN
  // We need a representation of the original virtual address offset value if we are to display it in non-test mode.
  // Let's assume this comes from a structure similar to the virtual address breakdown's offset part.
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
  userPfnBits: Array<0 | 1>;
  setUserPfnBits: (bits: Array<0 | 1>) => void;
  userOffsetBits: Array<0 | 1>;
  setUserOffsetBits: (bits: Array<0 | 1>) => void;
  validateUserAddressHex: () => boolean; // Function to validate the user's hex input
  virtualAddressForInputKey?: string; // To help with re-keying InputBinaryBlocks
}

export const PhysicalAddressDisplay: React.FC<PhysicalAddressDisplayProps> = ({
  systemInfo,
  translationData,
  testMode,
  formatNumber,
  userPhysicalAddressHex,
  setUserPhysicalAddressHex,
  userPfnBits,
  setUserPfnBits,
  userOffsetBits,
  setUserOffsetBits,
  validateUserAddressHex,
  virtualAddressForInputKey,
}) => {
  const totalPhysicalAddressBits = systemInfo.pfnBits + systemInfo.offsetBits;
  const hexInputLength = Math.ceil(totalPhysicalAddressBits / 4);

  return (
    <section className="w-full max-w-6xl">
      <div className={`bg-muted/50 rounded-lg p-6`}>
        <SubsectionHeading className={`h-9 ${testMode ? "mb-5" : "mt-1"}`}>
          Physical Address ({totalPhysicalAddressBits} bits):{" "}
          {testMode ? (
            <span className="inline-flex items-center gap-1">
              0x
              <input
                type="text"
                value={userPhysicalAddressHex}
                onChange={(e) =>
                  setUserPhysicalAddressHex(
                    e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase()
                  )
                }
                className="mt-1 max-w-20 rounded border border-gray-300 bg-white px-2 pt-1.5 pb-1 font-mono text-sm"
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
        <div className="flex items-center justify-center gap-2">
          {testMode ? (
            <>
              <InputBinaryBlock
                key={`pa-pfn-input-${virtualAddressForInputKey}`} // Use a key that changes with translation
                blocks={systemInfo.pfnBits}
                initialValues={userPfnBits}
                onChange={setUserPfnBits}
                color={physicalPfnColor}
                borderColor={physicalPfnBorder}
                hoverColor={physicalPfnColorHover}
                label="PFN"
                showBitNumbers={true}
                showLeftBorder={true}
                startBitNumber={systemInfo.offsetBits}
                tooltip={
                  testMode ? undefined : (
                    <div className="max-w-sm space-y-1">
                      <p className="text-sm font-medium">
                        Physical Frame Number ({systemInfo.pfnBits} bits)
                      </p>
                      <p className="text-xs">Enter the PFN bits from the final page table entry.</p>
                    </div>
                  )
                }
              />
              <InputBinaryBlock
                key={`pa-offset-input-${virtualAddressForInputKey}`} // Use a key that changes with translation
                blocks={systemInfo.offsetBits}
                initialValues={userOffsetBits}
                onChange={setUserOffsetBits}
                color={virtualOffsetColor}
                borderColor={virtualOffsetBorder}
                hoverColor={virtualOffsetColorHover}
                label="Offset"
                showBitNumbers={true}
                showLeftBorder={true}
                startBitNumber={0}
                tooltip={
                  testMode ? undefined : (
                    <div className="max-w-sm space-y-1">
                      <p className="text-sm font-medium">
                        Page Offset ({systemInfo.offsetBits} bits)
                      </p>
                      <p className="text-xs">Copy the offset bits from the virtual address.</p>
                    </div>
                  )
                }
              />
            </>
          ) : (
            <>
              <BinaryBlock
                key="pa-pfn"
                blocks={systemInfo.pfnBits}
                digits={TranslationSystem.toBinary(
                  translationData.finalPfn,
                  systemInfo.pfnBits
                ).split("")}
                color={physicalPfnColor}
                borderColor={physicalPfnBorder}
                hoverColor={physicalPfnColorHover}
                label={`PFN (${formatNumber(translationData.finalPfn)})`}
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
      </div>
    </section>
  );
};
