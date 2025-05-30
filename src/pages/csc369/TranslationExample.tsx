import React, { useState, useEffect, useMemo } from "react";
import {
  TranslationSystem,
  type PageTableLevel,
  type TranslationValues,
} from "./components/paging/TranslationSystem";
import { PhysicalMemorySize, PageSize } from "./components/paging/types";
import { SectionHeading } from "./components/paging/ui/SectionHeading";
import { TranslationControls } from "./components/paging/ui/TranslationControls";
import { VirtualAddressDisplay } from "./components/paging/ui/VirtualAddressDisplay";
import { PhysicalAddressDisplay } from "./components/paging/ui/PhysicalAddressDisplay";
import { AddressTranslationVisualizer } from "./components/paging/ui/AddressTranslationVisualizer";

export const TranslationExample: React.FC = () => {
  const [translationSystem, setTranslationSystem] = useState<TranslationSystem | null>(null);
  const [translation, setTranslation] = useState<TranslationValues | null>(null);
  const [showHex, setShowHex] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [selectedEntries, setSelectedEntries] = useState<Array<number | null>>([]);
  const [userPhysicalAddress, setUserPhysicalAddress] = useState<string>("");
  const [userPfnBits, setUserPfnBits] = useState<Array<0 | 1>>([]);
  const [userOffsetBits, setUserOffsetBits] = useState<Array<0 | 1>>([]);
  const [, setIsAnimating] = useState<boolean>(false);

  const pageTableLevels: PageTableLevel[] = [
    { indexBits: 8, label: "PD Index" },
    { indexBits: 8, label: "PT Index" },
  ];

  useEffect(() => {
    const system = new TranslationSystem(PhysicalMemorySize.KB_32, PageSize.B_256, pageTableLevels);
    setTranslationSystem(system);
    setTranslation(system.generateTranslation());
  }, []);

  const handleEntrySelection = (levelIndex: number, entryIndex: number) => {
    if (!testMode || !translation) return;
    const correctIndex = translation.virtualIndices[levelIndex];
    if (entryIndex === correctIndex) {
      setIsAnimating(true);
      const newSelectedEntries = [...selectedEntries];
      newSelectedEntries[levelIndex] = entryIndex;
      setSelectedEntries(newSelectedEntries);
    }
  };

  const isTestComplete = () => {
    if (!testMode || !translation) return false;
    return (
      selectedEntries.length === translation.pageTables.length &&
      selectedEntries.every((entry) => entry !== null && entry !== undefined)
    );
  };

  const generateNewTranslation = () => {
    if (translationSystem) {
      setTranslation(translationSystem.generateTranslation());
      setSelectedEntries([]);
      setUserPhysicalAddress("");
      setUserPfnBits([]);
      setUserOffsetBits([]);
    }
  };

  const formatNumber = (num: number, padLength?: number): string => {
    if (showHex) return TranslationSystem.toHex(num, padLength);
    return num.toString();
  };

  useEffect(() => {
    if (translation && translationSystem) {
      const systemInfoData = translationSystem.getSystemInfo();
      setUserPfnBits(Array(systemInfoData.pfnBits).fill(0));
      setUserOffsetBits(Array(systemInfoData.offsetBits).fill(0));
    }
  }, [translation, translationSystem]);

  useEffect(() => {
    if (translation && translationSystem) {
      const systemInfoData = translationSystem.getSystemInfo();
      setUserPfnBits(Array(systemInfoData.pfnBits).fill(0));
      setUserOffsetBits(Array(systemInfoData.offsetBits).fill(0));
      setUserPhysicalAddress("");
      setSelectedEntries([]);
      setIsAnimating(false);
      setTimeout(() => {}, 100);
    }
  }, [testMode, translation, translationSystem]);

  const validateUserAddress = () => {
    if (!translation || !translationSystem) return false;
    const userHex = userPhysicalAddress.toLowerCase();
    const correctHex = TranslationSystem.toHex(
      translation.physicalAddress,
      Math.ceil(
        (translationSystem.getSystemInfo().pfnBits + translationSystem.getSystemInfo().offsetBits) /
          4
      )
    )
      .toLowerCase()
      .replace("0x", "");
    return userHex === correctHex;
  };

  const memoizedDisplayData = useMemo(() => {
    if (!translation || !translationSystem) return [];
    return translation.pageTables.map((pageTable, levelIndex) => {
      const correctIndex = translation.virtualIndices[levelIndex];
      return translationSystem.getDisplayEntries(pageTable, correctIndex);
    });
  }, [translation, translationSystem]);

  if (!translationSystem || !translation) return <div>Loading...</div>;

  const systemInfo = translationSystem.getSystemInfo();
  const breakdown = translationSystem.getVirtualAddressBreakdown(translation);
  const vaBitCalculations = breakdown.indices.map((level, i) => {
    let startBit = breakdown.offset.bits.length;
    for (let k = i + 1; k < breakdown.indices.length; k++)
      startBit += breakdown.indices[k].bits.length;
    return { ...level, startBit };
  });
  const totalVirtualAddressBits =
    breakdown.indices.reduce((sum, item) => sum + item.bits.length, 0) +
    breakdown.offset.bits.length;

  const physicalAddressSystemInfo = {
    pfnBits: systemInfo.pfnBits,
    offsetBits: systemInfo.offsetBits,
  };
  const physicalAddressTranslationData = {
    physicalAddress: translation.physicalAddress,
    finalPfn: translation.finalPfn,
    virtualOffsetValue: breakdown.offset.value,
  };

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-24">
      <section className="w-full max-w-6xl">
        <SectionHeading>Virtual Address Translation</SectionHeading>
        <p className="text-muted-foreground mt-2 mb-6">
          This visualization demonstrates a step-by-step virtual to physical address translation
          process using hierarchical page tables. Click the button to generate a new random
          translation scenario.
        </p>
        <TranslationControls
          generateNewTranslation={generateNewTranslation}
          showHex={showHex}
          setShowHex={setShowHex}
          testMode={testMode}
          setTestMode={setTestMode}
        />
      </section>

      <VirtualAddressDisplay
        virtualAddress={translation.virtualAddress}
        totalVirtualAddressBits={totalVirtualAddressBits}
        virtualAddressIndices={vaBitCalculations}
        virtualAddressOffset={breakdown.offset}
        testMode={testMode}
        formatNumber={formatNumber}
        pageTableLevels={pageTableLevels}
      />

      <AddressTranslationVisualizer
        translationData={translation}
        memoizedDisplayData={memoizedDisplayData}
        selectedEntries={selectedEntries}
        testMode={testMode}
        showHex={showHex}
        isTestComplete={isTestComplete}
        formatNumber={formatNumber}
        handleEntrySelection={handleEntrySelection}
        setIsAnimating={setIsAnimating}
      />

      <PhysicalAddressDisplay
        systemInfo={physicalAddressSystemInfo}
        translationData={physicalAddressTranslationData}
        testMode={testMode}
        formatNumber={formatNumber}
        userPhysicalAddressHex={userPhysicalAddress}
        setUserPhysicalAddressHex={setUserPhysicalAddress}
        userPfnBits={userPfnBits}
        setUserPfnBits={setUserPfnBits}
        userOffsetBits={userOffsetBits}
        setUserOffsetBits={setUserOffsetBits}
        validateUserAddressHex={validateUserAddress}
        virtualAddressForInputKey={translation.virtualAddress.toString()}
      />
    </div>
  );
};
