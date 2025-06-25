import React, { useState, useEffect, useMemo } from "react";
import {
  TranslationSystem,
  type PageTable,
  type TranslationValues,
} from "./components/paging/TranslationSystemNew";
import { formatBytes } from "./components/paging/types";
import { translationExampleConfig } from "./components/paging/config";
import { translationExampleConstants, uiConstants } from "./components/paging/constants";
import { SectionHeading } from "./components/paging/ui/SectionHeading";
import { TranslationControls } from "./components/paging/ui/TranslationControls";
import { VirtualAddressDisplay } from "./components/paging/ui/VirtualAddressDisplay";
import { PhysicalAddressDisplay } from "./components/paging/ui/PhysicalAddressDisplay";
import { AddressTranslationVisualizer } from "./components/paging/ui/AddressTranslationVisualizer";

// Simple structure to track active state at each level
interface LevelState {
  tablePfn: number;
  selectedIndex: number | null; // null means not clicked yet
}

const TranslationExampleNew: React.FC = () => {
  const [translationSystem, setTranslationSystem] = useState<TranslationSystem | null>(null);
  const [translation, setTranslation] = useState<TranslationValues | null>(null);
  const [showHex, setShowHex] = useState<boolean>(translationExampleConstants.initialHexDisplay);
  const [testMode, setTestMode] = useState<boolean>(translationExampleConstants.initialTestMode);
  const [userPhysicalAddress, setUserPhysicalAddress] = useState<string>("");
  const [userOffsetBits, setUserOffsetBits] = useState<Array<0 | 1>>([]);
  const [, setIsAnimating] = useState<boolean>(false);
  const [hexHintMode, setHexHintMode] = useState<boolean>(
    translationExampleConstants.initialHexHintMode
  );

  // New simplified state: track active tables and indices for each level
  const [activeLevels, setActiveLevels] = useState<LevelState[]>([]);
  const [finalPfn, setFinalPfn] = useState<{ pfn: number; physicalAddress: number } | null>(null);

  // State for storing dynamically generated tables
  const [generatedTables, setGeneratedTables] = useState<Map<string, PageTable>>(new Map());

  useEffect(() => {
    const system = new TranslationSystem(
      translationExampleConfig.defaultPhysicalMemorySize,
      translationExampleConfig.defaultPageSize,
      translationExampleConfig.defaultPageTableLevels,
      translationExampleConfig.defaultInvalidEntryProbability
    );
    setTranslationSystem(system);
    setTranslation(system.getTranslationValues());
  }, []);

  // Initialize state when translation or testMode changes
  useEffect(() => {
    if (translation && translationSystem) {
      // General resets for any mode change
      setUserPhysicalAddress("");
      const systemInfoData = translationSystem.getSystemInfo();
      setUserOffsetBits(Array(systemInfoData.offsetBits).fill(0));
      setGeneratedTables(new Map());

      // Mode-specific setup
      if (testMode) {
        // In test mode: start with only L0 table, no selections
        setActiveLevels([{ tablePfn: translation.pageTables[0].tablePfn, selectedIndex: null }]);
        setFinalPfn(null);
      } else {
        // In non-test mode: show all correct tables with correct selections
        const levels = translation.pageTables.map((table, index) => ({
          tablePfn: table.tablePfn,
          selectedIndex: translation.virtualIndices[index],
        }));
        setActiveLevels(levels);
        // Set final PFN immediately in non-test mode
        setFinalPfn({
          pfn: translation.finalPfn,
          physicalAddress: translation.physicalAddress,
        });
        // Turn off hex hint mode when exiting test mode
        setHexHintMode(false);
      }
    }
  }, [translation, translationSystem, testMode]);

  const handleEntrySelection = (levelIndex: number, entryIndex: number) => {
    if (!translation || !translationSystem || !testMode) {
      return;
    }

    const currentLevel = activeLevels[levelIndex];
    if (!currentLevel) {
      return;
    }

    const newGeneratedTables = new Map(generatedTables);
    const tableKey = `${levelIndex}-${currentLevel.tablePfn}`;
    let clickedTable = generatedTables.get(tableKey);

    if (!clickedTable) {
      if (levelIndex === 0) {
        clickedTable = translation.pageTables[0];
      } else {
        if (currentLevel.tablePfn === translation.pageTables[levelIndex]?.tablePfn) {
          clickedTable = translation.pageTables[levelIndex];
        } else {
          clickedTable = translationSystem.getPageTableForDisplay(
            currentLevel.tablePfn,
            levelIndex
          );
        }
      }
      newGeneratedTables.set(tableKey, clickedTable);
    }

    const relativeIndex = entryIndex - clickedTable.startIndex;

    if (relativeIndex < 0 || relativeIndex >= clickedTable.entries.length) {
      return;
    }

    const clickedEntry = clickedTable.entries[relativeIndex];
    if (!clickedEntry || !clickedEntry.valid) {
      return;
    }

    const newActiveLevels = [...activeLevels];
    newActiveLevels[levelIndex] = {
      ...currentLevel,
      selectedIndex: entryIndex,
    };

    newActiveLevels.splice(levelIndex + 1);

    const isLastLevel = levelIndex === translation.pageTables.length - 1;
    const isPTE = clickedEntry.rwx !== null;

    if (isPTE || isLastLevel) {
      const physicalAddress =
        (clickedEntry.pfn << translationSystem.getSystemInfo().offsetBits) | translation.offset;

      setFinalPfn({
        pfn: clickedEntry.pfn,
        physicalAddress: physicalAddress,
      });
    } else {
      try {
        const nextLevelTable = translationSystem.getPageTableForDisplay(
          clickedEntry.pfn,
          levelIndex + 1
        );
        const nextLevelTableKey = `${levelIndex + 1}-${nextLevelTable.tablePfn}`;
        newGeneratedTables.set(nextLevelTableKey, nextLevelTable);

        newActiveLevels.push({
          tablePfn: nextLevelTable.tablePfn,
          selectedIndex: null,
        });

        setFinalPfn(null);
      } catch (error) {
        console.error("Error generating next level table:", error);
        return;
      }
    }

    setGeneratedTables(newGeneratedTables);
    setActiveLevels(newActiveLevels);
  };

  const isTestComplete = () => {
    if (!testMode || !translation) return false;
    return finalPfn !== null && finalPfn.pfn === translation.finalPfn;
  };

  const generateNewTranslation = () => {
    if (translationSystem) {
      // Use the same parameters as the current system
      const systemInfo = translationSystem.getSystemInfo();
      const newSystem = new TranslationSystem(
        systemInfo.physicalMemorySize,
        systemInfo.pageSize,
        systemInfo.pageTableLevels
      );
      setTranslationSystem(newSystem);
      setTranslation(newSystem.getTranslationValues());
      setUserPhysicalAddress("");
      setUserOffsetBits([]);

      // Clear exploration state
      setActiveLevels([]);
      setFinalPfn(null);
      setGeneratedTables(new Map());
    }
  };

  const formatNumber = (num: number, padLength?: number): string => {
    if (showHex) return TranslationSystem.toHex(num, padLength);
    return num.toString();
  };

  useEffect(() => {
    if (translation && translationSystem) {
      const systemInfoData = translationSystem.getSystemInfo();
      setUserOffsetBits(Array(systemInfoData.offsetBits).fill(0));
    }
  }, [translation, translationSystem]);

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

  const displayedPageTables = useMemo(() => {
    if (!translation) return [];

    if (!testMode) {
      return translation.pageTables;
    }

    const tables = activeLevels.map((level, levelIndex) => {
      const tableKey = `${levelIndex}-${level.tablePfn}`;
      if (levelIndex === 0) {
        return generatedTables.get(tableKey) || translation.pageTables[0];
      }
      return generatedTables.get(tableKey);
    });

    const finalTables = [...translation.pageTables];
    tables.forEach((table, index) => {
      if (table) {
        finalTables[index] = table;
      }
    });

    return finalTables;
  }, [translation, testMode, activeLevels, generatedTables]);

  const memoizedDisplayData = useMemo(() => {
    if (!translation || !translationSystem) return [];

    const originalTables = translation.pageTables.map((pageTable, levelIndex) => {
      const correctIndex = translation.virtualIndices[levelIndex];
      const displayEntries = translationSystem.getDisplayEntries(pageTable, correctIndex);
      return displayEntries;
    });

    if (activeLevels.length === 0) {
      return originalTables;
    }

    const displayData = [...originalTables];

    activeLevels.forEach((level, levelIndex) => {
      const tableKey = `${levelIndex}-${level.tablePfn}`;
      let exploredTable = generatedTables.get(tableKey);

      if (!exploredTable) {
        if (levelIndex === 0) {
          exploredTable = translation.pageTables[0];
        } else {
          return;
        }
      }

      if (exploredTable && levelIndex < displayData.length) {
        const originalCorrectIndex = translation.virtualIndices[levelIndex];
        const originalCorrectTable = translation.pageTables[levelIndex];
        const isCorrectTable = exploredTable.tablePfn === originalCorrectTable.tablePfn;

        const exploredDisplayData = translationSystem.getDisplayEntries(
          exploredTable,
          isCorrectTable &&
            originalCorrectIndex >= 0 &&
            originalCorrectIndex < exploredTable.entries.length
            ? originalCorrectIndex
            : -1
        );

        displayData[levelIndex] = exploredDisplayData;
      }
    });

    return displayData;
  }, [translation, translationSystem, activeLevels, generatedTables]);

  const dynamicTranslationData = useMemo(() => {
    if (!translation) return null;

    return {
      ...translation,
      pageTables: displayedPageTables,
    };
  }, [translation, displayedPageTables]);

  if (!translationSystem || !translation || !dynamicTranslationData) return <div>Loading...</div>;

  const systemInfo = translationSystem.getSystemInfo();
  const breakdown = translationSystem.getVirtualAddressBreakdown(dynamicTranslationData);

  const vaBitCalculations = breakdown.indices.map((level, i) => {
    let startBit = breakdown.offset.bits.length;
    for (let k = i + 1; k < breakdown.indices.length; k++)
      startBit += breakdown.indices[k].bits.length;

    const pageTable = dynamicTranslationData.pageTables[i];
    const actualIndex = pageTable.startIndex + dynamicTranslationData.virtualIndices[i];

    return {
      ...level,
      value: actualIndex,
      startBit,
    };
  });

  const totalVirtualAddressBits =
    breakdown.indices.reduce((sum, item) => sum + item.bits.length, 0) +
    breakdown.offset.bits.length;

  const physicalAddressSystemInfo = {
    pfnBits: systemInfo.pfnBits,
    offsetBits: systemInfo.offsetBits,
  };

  const physicalAddressTranslationData = {
    physicalAddress:
      testMode && finalPfn ? finalPfn.physicalAddress : dynamicTranslationData.physicalAddress,
    finalPfn: testMode ? (finalPfn ? finalPfn.pfn : undefined) : dynamicTranslationData.finalPfn,
    virtualOffsetValue: breakdown.offset.value,
  };

  return (
    <div
      className={`${uiConstants.flexColCenter} ${uiConstants.sectionGap} ${uiConstants.containerPadding} ${uiConstants.bottomPadding}`}
    >
      <section className={`${uiConstants.fullWidth} ${uiConstants.maxContainerWidth}`}>
        <SectionHeading>A Detailed Multi-level Page Table Translation Example</SectionHeading>
        <div className="text-muted-foreground mt-2 mb-6 space-y-3">
          <p>
            To build a multi-level page table for this address space, we start with our full linear
            page table and break it up into page-sized units. This visualization demonstrates an
            address translation process using hierarchical page tables with{" "}
            {systemInfo.pageTableLevels} levels. With {formatBytes(systemInfo.physicalMemorySize)}{" "}
            physical memory and {formatBytes(systemInfo.pageSize)} pages, we get{" "}
            {((systemInfo.physicalMemorySize / 1024) * 1024) / systemInfo.pageSize} total pages
            requiring{" "}
            {Math.log2(((systemInfo.physicalMemorySize / 1024) * 1024) / systemInfo.pageSize)} PFN
            bits. The {Math.log2(systemInfo.pageSize)} offset bits handle byte positioning within
            each page. Each page table can hold {systemInfo.pageSize / 4} entries (4 bytes per
            entry), requiring {Math.log2(systemInfo.pageSize / 4)} bits to index within a table.
          </p>
        </div>
        <TranslationControls
          generateNewTranslation={generateNewTranslation}
          showHex={showHex}
          setShowHex={setShowHex}
          testMode={testMode}
          setTestMode={setTestMode}
          hexHintMode={hexHintMode}
          setHexHintMode={setHexHintMode}
        />
      </section>

      <VirtualAddressDisplay
        virtualAddress={dynamicTranslationData.virtualAddress}
        totalVirtualAddressBits={totalVirtualAddressBits}
        virtualAddressIndices={vaBitCalculations}
        virtualAddressOffset={breakdown.offset}
        testMode={testMode}
        formatNumber={formatNumber}
        pageTableLevels={systemInfo.pageTableLevels}
        hexHintMode={hexHintMode}
        setHexHintMode={setHexHintMode}
      />

      <AddressTranslationVisualizer
        translationData={dynamicTranslationData}
        memoizedDisplayData={memoizedDisplayData}
        activeLevels={activeLevels}
        finalPfn={finalPfn}
        testMode={testMode}
        showHex={showHex}
        isTestComplete={isTestComplete}
        formatNumber={formatNumber}
        handleEntrySelection={handleEntrySelection}
        setIsAnimating={setIsAnimating}
        pageTableCapacity={systemInfo.pageSize / translationExampleConstants.pageTableEntrySize}
      />

      <PhysicalAddressDisplay
        systemInfo={physicalAddressSystemInfo}
        translationData={physicalAddressTranslationData}
        testMode={testMode}
        formatNumber={formatNumber}
        userPhysicalAddressHex={userPhysicalAddress}
        setUserPhysicalAddressHex={setUserPhysicalAddress}
        userOffsetBits={userOffsetBits}
        setUserOffsetBits={setUserOffsetBits}
        validateUserAddressHex={validateUserAddress}
        virtualAddressForInputKey={dynamicTranslationData.virtualAddress.toString()}
        hexHintMode={hexHintMode}
        setHexHintMode={setHexHintMode}
      />
    </div>
  );
};

export { TranslationExampleNew };
