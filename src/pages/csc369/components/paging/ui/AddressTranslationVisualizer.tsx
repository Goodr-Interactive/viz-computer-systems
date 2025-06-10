import React, { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import * as d3 from "d3";
import { StringBlock } from "./StringBlock";
import { PageTableDisplay } from "./PageTableDisplay";
import { SubsectionHeading } from "./SubsectionHeading";
import type { TranslationValues, PageTableEntry } from "../TranslationSystemNew";
import { TranslationSystem } from "../TranslationSystemNew";
import {
  physicalPfnColor,
  physicalPfnBorder,
  physicalPfnColorHover,
  pdbrColor,
  pdbrBorder,
  pdbrColorHover,
} from "../constants";

interface ArrowRenderConfig {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isOrthogonal: boolean;
}

// Props for PageTableDisplay's tableDisplayData (subset of what memoizedDisplayData produced)
interface DisplayEntry {
  entry: PageTableEntry; // Replace 'any' with actual PageTableEntry type
  index: number;
  isCorrect: boolean;
}
interface TableDisplayData {
  entries: DisplayEntry[];
  startIndex: number;
  endIndex: number;
}

// Simple structure to track active state at each level
interface LevelState {
  tablePfn: number;
  selectedIndex: number | null; // null means not clicked yet
}

interface AddressTranslationVisualizerProps {
  translationData: TranslationValues | null; // Contains PDBR, pageTables, finalPfn, virtualIndices
  memoizedDisplayData: TableDisplayData[]; // Pre-calculated display data for each table
  activeLevels: LevelState[];
  finalPfn: { pfn: number; physicalAddress: number } | null;
  testMode: boolean;
  showHex: boolean;
  isTestComplete: () => boolean;
  formatNumber: (num: number, padLength?: number) => string;
  handleEntrySelection: (levelIndex: number, entryIndex: number) => void;
  // We will also need isAnimating and setIsAnimating for the motion components callbacks
  // but drawArrows will no longer be gated by isAnimating itself.
  setIsAnimating: (isAnimating: boolean) => void;
  // Add page table capacity
  pageTableCapacity: number;
}

export const AddressTranslationVisualizer: React.FC<AddressTranslationVisualizerProps> = ({
  translationData,
  memoizedDisplayData,
  activeLevels,
  finalPfn,
  testMode,
  showHex,
  isTestComplete,
  formatNumber,
  handleEntrySelection,
  setIsAnimating,
  pageTableCapacity,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // For arrow coordinate calculations
  const pdbrRef = useRef<HTMLDivElement>(null);
  const pageTableContainerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activePfnCellRefs = useRef<Array<HTMLTableCellElement | null>>([]);
  const tableElementRefs = useRef<Array<HTMLTableElement | null>>([]);
  const finalPfnBlockRef = useRef<HTMLDivElement>(null);

  const drawArrows = useCallback(() => {
    if (!svgRef.current || !translationData || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const containerRect = containerRef.current.getBoundingClientRect();
    const arrowConfigs: ArrowRenderConfig[] = [];

    // 1. PDBR to First Table
    if (pdbrRef.current && tableElementRefs.current[0]) {
      const pdbrBlockElement = pdbrRef.current.querySelector(".group");
      const firstTableElement = tableElementRefs.current[0];
      if (pdbrBlockElement && firstTableElement) {
        const pdbrRect = pdbrBlockElement.getBoundingClientRect();
        // Target the Valid header cell (second th element)
        const validHeaderCell = firstTableElement.querySelector("thead th:nth-child(2)");
        if (validHeaderCell) {
          const validHeaderRect = validHeaderCell.getBoundingClientRect();
          arrowConfigs.push({
            id: "pdbr-to-table0",
            startX: pdbrRect.right + 10 - containerRect.left,
            startY: pdbrRect.top + pdbrRect.height / 2 - containerRect.top,
            endX: validHeaderRect.left - containerRect.left - 10,
            endY: validHeaderRect.top - containerRect.top,
            isOrthogonal: true,
          });
        }
      }
    }

    // 2. Table to Table Arrows
    for (
      let i = 0;
      i < Math.min(translationData.pageTables.length - 1, activeLevels.length - 1);
      i++
    ) {
      // Arrow logic:
      // - Non-test mode: Draw all arrows
      // - Test mode: Draw arrows if current level has selection and next level exists
      const currentLevelHasSelection = activeLevels[i] && activeLevels[i].selectedIndex !== null;
      const nextLevelExists = activeLevels[i + 1] !== undefined;

      const shouldDrawArrow = !testMode || (currentLevelHasSelection && nextLevelExists);

      if (shouldDrawArrow) {
        const activePfnCell = activePfnCellRefs.current[i];
        const nextTableElement = tableElementRefs.current[i + 1];
        if (activePfnCell && nextTableElement) {
          const pfnCellRect = activePfnCell.getBoundingClientRect();
          // Target the Valid header cell (second th element)
          const validHeaderCell = nextTableElement.querySelector("thead th:nth-child(2)");
          if (validHeaderCell) {
            const validHeaderRect = validHeaderCell.getBoundingClientRect();
            arrowConfigs.push({
              id: `table${i}-to-table${i + 1}`,
              startX: pfnCellRect.right + 10 - containerRect.left,
              startY: pfnCellRect.top + pfnCellRect.height / 2 - containerRect.top,
              endX: validHeaderRect.left - containerRect.left - 10,
              endY: validHeaderRect.top - containerRect.top,
              isOrthogonal: true,
            });
          }
        }
      }
    }

    // 3. Last Table to Final PFN
    // Show arrow if finalPfn exists or in non-test mode when complete
    const shouldDrawFinalArrow = finalPfn !== null || !testMode || isTestComplete();
    if (
      shouldDrawFinalArrow &&
      activePfnCellRefs.current.length > 0 &&
      finalPfnBlockRef.current &&
      tableElementRefs.current.length > 0
    ) {
      const lastLevelIndex = activeLevels.length - 1;
      const lastActivePfnCell = activePfnCellRefs.current[lastLevelIndex];
      const finalPfnBlockElement = finalPfnBlockRef.current.querySelector(".group");
      if (lastActivePfnCell && finalPfnBlockElement) {
        const pfnCellRect = lastActivePfnCell.getBoundingClientRect();
        const finalBlockRect = finalPfnBlockElement.getBoundingClientRect();
        arrowConfigs.push({
          id: `table${lastLevelIndex}-to-finalpfn`,
          startX: pfnCellRect.right + 10 - containerRect.left,
          startY: pfnCellRect.top + pfnCellRect.height / 2 - containerRect.top,
          endX: finalBlockRect.left - containerRect.left - 10,
          endY: finalBlockRect.top + finalBlockRect.height / 2 - containerRect.top,
          isOrthogonal:
            Math.abs(
              pfnCellRect.top +
                pfnCellRect.height / 2 -
                (finalBlockRect.top + finalBlockRect.height / 2)
            ) >= 20,
        });
      }
    }

    const arrows = svg
      .selectAll<SVGPathElement, ArrowRenderConfig>("path.arrow")
      .data(arrowConfigs, (d) => d.id);

    arrows.exit().transition().duration(400).attr("opacity", 0).remove();

    const enteringArrows = arrows
      .enter()
      .append("path")
      .attr("class", "arrow")
      .attr("stroke", "#b5b9c1")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 3")
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)")
      .attr("opacity", 0);

    // Merge entering and existing arrows, then update positions
    enteringArrows
      .merge(arrows)
      .transition()
      .duration(400)
      .attr("d", (d) => {
        const midPointX = d.startX + (d.endX - d.startX) * 0.4;
        const cornerRadius = 16; // Radius for the curved corner
        return d.isOrthogonal
          ? `M ${d.startX} ${d.startY} L ${midPointX - cornerRadius} ${d.startY} Q ${midPointX} ${d.startY} ${midPointX} ${d.startY + Math.sign(d.endY - d.startY) * cornerRadius} L ${midPointX} ${d.endY - Math.sign(d.endY - d.startY) * cornerRadius} Q ${midPointX} ${d.endY} ${midPointX + cornerRadius} ${d.endY} L ${d.endX} ${d.endY}`
          : `M ${d.startX} ${d.startY} L ${d.endX} ${d.endY}`;
      })
      .attr("opacity", 1);

    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) defs = svg.append<SVGDefsElement>("defs");
    if (defs.select("#arrowhead").empty()) {
      defs
        .append("marker")
        .attr("id", "arrowhead")
        .attr("markerWidth", 10)
        .attr("markerHeight", 7)
        .attr("refX", 9)
        .attr("refY", 3.5)
        .attr("orient", "auto")
        .append("polygon")
        .attr("points", "0 0, 10 3.5, 0 7")
        .attr("fill", "#b5b9c1");
    }
  }, [translationData, testMode, activeLevels, finalPfn, isTestComplete]);

  useEffect(() => {
    const initialTimer = setTimeout(drawArrows, 100); // Initial draw with slight delay
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawArrows, testMode ? 25 : 50);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [drawArrows, testMode]);

  useEffect(() => {
    // Redraw arrows when test progress changes (selectedEntries) or testMode itself changes
    const timer = setTimeout(drawArrows, 50); // Short delay
    return () => clearTimeout(timer);
  }, [activeLevels, testMode, drawArrows]);

  useEffect(() => {
    // Redraw arrows when new translation is generated (translationData changes)
    // This is important because table entries move and arrow start positions need updating
    if (translationData) {
      const timer = setTimeout(drawArrows, 100); // Slightly longer delay to ensure tables are rendered
      return () => clearTimeout(timer);
    }
  }, [translationData, drawArrows]);

  if (!translationData)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        Loading translation process...
      </div>
    ); // Or some placeholder

  return (
    <section className="min-h-[492px] w-full max-w-7xl overflow-x-auto">
      <div className="bg-muted/50 h-full min-w-fit rounded-lg p-6">
        <SubsectionHeading>Address Translation Process</SubsectionHeading>
        <div className="flex flex-col gap-8">
          <div className="w-full overflow-x-auto">
            <div
              className="relative flex min-h-[400px] items-center justify-center"
              ref={containerRef}
            >
              <LayoutGroup>
                <div
                  className="flex min-w-fit flex-nowrap items-start justify-start gap-10"
                  style={{ margin: "0 auto", width: "max-content" }}
                >
                  {/* PDBR Block */}
                  <motion.div
                    ref={pdbrRef}
                    className={`my-auto flex flex-shrink-0 flex-col items-center`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      opacity: { duration: 0.3, ease: "easeOut" },
                      layout: { duration: 0.3 },
                    }}
                    onAnimationStart={() => setIsAnimating(true)}
                    onAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                    onLayoutAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                  >
                    <StringBlock
                      value={formatNumber(translationData.pdbr)}
                      color={pdbrColor}
                      borderColor={pdbrBorder}
                      hoverColor={pdbrColorHover}
                      label="PDBR"
                      showLeftBorder={true}
                      tooltip={
                        testMode ? undefined : (
                          <div className="max-w-xs space-y-1 text-left">
                            <p className="text-sm font-medium">
                              PDBR: {formatNumber(translationData.pdbr)}
                              {!showHex &&
                                ` (Hex: ${TranslationSystem.toHex(translationData.pdbr)})`}
                            </p>
                            <p className="text-xs">Points to the first-level page table's PFN.</p>
                          </div>
                        )
                      }
                    />
                  </motion.div>

                  {/* Page Tables */}
                  <AnimatePresence mode="popLayout">
                    {translationData.pageTables.map((pageTable, levelIndex) => {
                      // Visibility logic:
                      // - Non-test mode: Show all tables
                      // - Test mode: Show level 0 + any levels that are active
                      const isVisible =
                        !testMode || levelIndex === 0 || levelIndex < activeLevels.length;

                      return (
                        <PageTableDisplay
                          key={levelIndex} // Framer motion might prefer unique string keys if order changes, but levelIndex is fine for now
                          levelIndex={levelIndex}
                          pageTablePfn={pageTable.tablePfn}
                          tableDisplayData={memoizedDisplayData[levelIndex]}
                          totalEntriesInTable={pageTableCapacity}
                          selectedEntriesForTest={activeLevels.map((level) => level.selectedIndex)}
                          currentExplorationPath={[]} // Empty array since we're not using exploration path anymore
                          testMode={testMode}
                          showHex={showHex}
                          formatNumber={formatNumber}
                          handleEntrySelection={handleEntrySelection}
                          pageTableContainerRef={(el) =>
                            (pageTableContainerRefs.current[levelIndex] = el)
                          }
                          pageTableElementRef={(el) => (tableElementRefs.current[levelIndex] = el)}
                          activePfnCellRef={(el) => (activePfnCellRefs.current[levelIndex] = el)}
                          isVisible={isVisible}
                          onAnimationStart={() => setIsAnimating(true)}
                          onAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                          onLayoutAnimationComplete={() =>
                            setTimeout(() => setIsAnimating(false), 100)
                          }
                        />
                      );
                    })}
                  </AnimatePresence>

                  {/* Final PFN Block or Explored PTE Block */}
                  <div className="relative my-auto ml-16 flex-shrink-0" ref={finalPfnBlockRef}>
                    {/* Sizer block to ensure the container has the correct dimensions and prevent layout shift */}
                    <div className="invisible">
                      <StringBlock
                        value={formatNumber(translationData.finalPfn)}
                        color="transparent"
                        borderColor="transparent"
                        hoverColor="transparent"
                        label="PFN"
                        showLeftBorder={true}
                      />
                    </div>

                    {/* Correct PFN block (absolutely positioned) */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity:
                          !testMode || (finalPfn && finalPfn.pfn === translationData.finalPfn)
                            ? 1
                            : 0,
                      }}
                      transition={{ opacity: { duration: 0.4 } }}
                      onAnimationStart={() => setIsAnimating(true)}
                      onAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                    >
                      <StringBlock
                        value={formatNumber(translationData.finalPfn)}
                        color={physicalPfnColor}
                        borderColor={physicalPfnBorder}
                        hoverColor={physicalPfnColorHover}
                        label="PFN"
                        showLeftBorder={true}
                        tooltip={
                          testMode ? undefined : (
                            <div className="max-w-xs space-y-1 text-left">
                              <p className="text-sm font-medium">
                                Final PFN: {formatNumber(translationData.finalPfn)}
                                {!showHex &&
                                  ` (Hex: ${TranslationSystem.toHex(translationData.finalPfn)})`}
                              </p>
                              <p className="text-xs">
                                This is the Page Frame Number of the physical memory page for the
                                above virtual address.
                              </p>
                            </div>
                          )
                        }
                      />
                    </motion.div>

                    {/* Explored (incorrect) PFN block */}
                    <motion.div
                      className={`absolute inset-0 flex items-center justify-center ${
                        testMode && finalPfn && finalPfn.pfn !== translationData.finalPfn
                          ? ""
                          : "pointer-events-none"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity:
                          testMode && finalPfn && finalPfn.pfn !== translationData.finalPfn ? 1 : 0,
                      }}
                      transition={{ opacity: { duration: 0.4 } }}
                      onAnimationStart={() => setIsAnimating(true)}
                      onAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                    >
                      {finalPfn && (
                        <StringBlock
                          value={formatNumber(finalPfn.pfn)}
                          color="transparent"
                          borderColor="border-border"
                          hoverColor="hover:bg-gray-200/50"
                          label="PFN"
                          showLeftBorder={true}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              </LayoutGroup>
              <svg
                ref={svgRef}
                className="pointer-events-none absolute top-0 left-0 h-full w-full"
                style={{ zIndex: 10 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
