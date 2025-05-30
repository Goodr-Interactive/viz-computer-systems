import React, { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import * as d3 from "d3";
import { BinaryBlock } from "./BinaryBlock";
import { PageTableDisplay } from "./PageTableDisplay";
import { SubsectionHeading } from "./SubsectionHeading";
import type { TranslationValues, PageTableEntry } from "../TranslationSystem"; // Added PageTableEntry import

// Color constants - these could be passed as props or imported from a central place
// For now, keeping them local to where they are used (PDBR, Final PFN)
const physicalPfnColor = "bg-sky-100";
const physicalPfnBorder = "border-sky-300";
const physicalPfnColorHover = "group-hover:bg-sky-200";

const pdbrColor = "bg-gray-100";
const pdbrBorder = "border-gray-300";
const pdbrColorHover = "group-hover:bg-gray-200";

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

interface AddressTranslationVisualizerProps {
  translationData: TranslationValues | null; // Contains PDBR, pageTables, finalPfn, virtualIndices
  memoizedDisplayData: TableDisplayData[]; // Pre-calculated display data for each table
  selectedEntries: Array<number | null>;
  testMode: boolean;
  showHex: boolean;
  isTestComplete: () => boolean;
  formatNumber: (num: number, padLength?: number) => string;
  handleEntrySelection: (levelIndex: number, entryIndex: number) => void;
  // We will also need isAnimating and setIsAnimating for the motion components callbacks
  // but drawArrows will no longer be gated by isAnimating itself.
  setIsAnimating: (isAnimating: boolean) => void;
}

export const AddressTranslationVisualizer: React.FC<AddressTranslationVisualizerProps> = ({
  translationData,
  memoizedDisplayData,
  selectedEntries,
  testMode,
  showHex,
  isTestComplete,
  formatNumber,
  handleEntrySelection,
  setIsAnimating, // Received from parent
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
        const firstTableRect = firstTableElement.getBoundingClientRect();
        arrowConfigs.push({
          id: "pdbr-to-table0",
          startX: pdbrRect.right + 10 - containerRect.left,
          startY: pdbrRect.top + pdbrRect.height / 2 - containerRect.top,
          endX: firstTableRect.left - containerRect.left - 10,
          endY: firstTableRect.top - containerRect.top,
          isOrthogonal: true,
        });
      }
    }

    // 2. Table to Table Arrows
    for (let i = 0; i < translationData.pageTables.length - 1; i++) {
      const shouldDrawArrow =
        !testMode || (selectedEntries[i] !== undefined && selectedEntries[i] !== null);
      if (shouldDrawArrow) {
        const activePfnCell = activePfnCellRefs.current[i];
        const nextTableElement = tableElementRefs.current[i + 1];
        if (activePfnCell && nextTableElement) {
          const pfnCellRect = activePfnCell.getBoundingClientRect();
          const nextTableRect = nextTableElement.getBoundingClientRect();
          arrowConfigs.push({
            id: `table${i}-to-table${i + 1}`,
            startX: pfnCellRect.right + 10 - containerRect.left,
            startY: pfnCellRect.top + pfnCellRect.height / 2 - containerRect.top,
            endX: nextTableRect.left - containerRect.left - 10,
            endY: nextTableRect.top - containerRect.top,
            isOrthogonal: true,
          });
        }
      }
    }

    // 3. Last Table to Final PFN
    const shouldDrawFinalArrow = !testMode || isTestComplete();
    if (
      shouldDrawFinalArrow &&
      activePfnCellRefs.current.length > 0 &&
      finalPfnBlockRef.current &&
      tableElementRefs.current.length > 0
    ) {
      const lastPfnCellIndex = translationData.pageTables.length - 1;
      const lastActivePfnCell = activePfnCellRefs.current[lastPfnCellIndex];
      const finalPfnBlockElement = finalPfnBlockRef.current.querySelector(".group");
      if (lastActivePfnCell && finalPfnBlockElement) {
        const pfnCellRect = lastActivePfnCell.getBoundingClientRect();
        const finalBlockRect = finalPfnBlockElement.getBoundingClientRect();
        arrowConfigs.push({
          id: `table${lastPfnCellIndex}-to-finalpfn`,
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
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)")
      .attr("opacity", 0);

    // Merge entering and existing arrows, then update positions
    enteringArrows
      .merge(arrows)
      .transition()
      .duration(400)
      .attr("d", (d) => {
        const midPointX = d.startX + (d.endX - d.startX) * 0.5;
        return d.isOrthogonal
          ? `M ${d.startX} ${d.startY} L ${midPointX} ${d.startY} L ${midPointX} ${d.endY} L ${d.endX} ${d.endY}`
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
        .attr("fill", "#9ca3af");
    }
  }, [translationData, testMode, selectedEntries, isTestComplete]); // Removed isAnimating dependency

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
  }, [selectedEntries, testMode, drawArrows]);

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
    <section className="w-full max-w-6xl">
      <div className="bg-muted/50 rounded-lg p-6">
        <SubsectionHeading>Address Translation Process</SubsectionHeading>
        <div className="flex flex-col gap-8">
          <div
            className="relative flex min-h-[400px] items-center justify-center"
            ref={containerRef}
          >
            <LayoutGroup>
              <div className="flex h-full w-full items-start justify-center gap-16 overflow-x-auto">
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
                  <BinaryBlock
                    blocks={1}
                    color={pdbrColor}
                    borderColor={pdbrBorder}
                    hoverColor={pdbrColorHover}
                    label="PDBR"
                    showBitNumbers={false}
                    showLeftBorder={true}
                    tooltip={
                      testMode ? undefined : (
                        <div className="max-w-xs space-y-1 text-left">
                          <p className="text-sm font-medium">
                            PDBR: {formatNumber(translationData.pdbr)}
                            {!showHex && ` (Hex: ${d3.format(".0x")(translationData.pdbr)})`}
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
                    const isVisible =
                      !testMode ||
                      levelIndex === 0 ||
                      (selectedEntries[levelIndex - 1] !== undefined &&
                        selectedEntries[levelIndex - 1] !== null);

                    return (
                      <PageTableDisplay
                        key={levelIndex} // Framer motion might prefer unique string keys if order changes, but levelIndex is fine for now
                        levelIndex={levelIndex}
                        pageTablePfn={pageTable.tablePfn}
                        tableDisplayData={memoizedDisplayData[levelIndex]}
                        totalEntriesInTable={pageTable.entries.length}
                        virtualIndexForThisLevel={translationData.virtualIndices[levelIndex]}
                        selectedEntriesForTest={selectedEntries}
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

                {/* Final PFN Block */}
                <AnimatePresence>
                  <motion.div
                    ref={finalPfnBlockRef}
                    className="my-auto flex flex-shrink-0 flex-col items-center"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: !testMode || isTestComplete() ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: 0.4, ease: "easeOut" },
                      layout: { duration: 0.3 },
                    }}
                    onAnimationStart={() => setIsAnimating(true)}
                    onAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                    onLayoutAnimationComplete={() => setTimeout(() => setIsAnimating(false), 100)}
                  >
                    <BinaryBlock
                      blocks={1}
                      color={physicalPfnColor}
                      borderColor={physicalPfnBorder}
                      hoverColor={physicalPfnColorHover}
                      label="PFN"
                      showBitNumbers={false}
                      showLeftBorder={true}
                      tooltip={
                        testMode ? undefined : (
                          <div className="max-w-xs space-y-1 text-left">
                            <p className="text-sm font-medium">
                              Final PFN: {formatNumber(translationData.finalPfn)}
                              {!showHex && ` (Hex: ${d3.format(".0x")(translationData.finalPfn)})`}
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
                </AnimatePresence>
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
    </section>
  );
};
