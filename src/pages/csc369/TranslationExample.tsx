import React, { useState, useEffect, useRef, useCallback } from "react";
import { TranslationSystem, type PageTableLevel, type TranslationValues } from "./components/paging/TranslationSystem";
import { BinaryBlock } from "./components/paging/BinaryBlock";
import { PhysicalMemorySize, PageSize } from "./components/paging/types";
import { PageTableLevelColors } from "./components/paging/constants";
import { SubsectionHeading } from "./components/paging/ui/SubsectionHeading";
import { SectionHeading } from "./components/paging/ui/SectionHeading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as d3 from "d3";

// Define consistent colors and their hover states
const virtualOffsetColor = "bg-emerald-100";
const virtualOffsetBorder = "border-emerald-300";
const virtualOffsetColorHover = "group-hover:bg-emerald-200";

const physicalPfnColor = "bg-sky-100";
const physicalPfnBorder = "border-sky-300";
const physicalPfnColorHover = "group-hover:bg-sky-200";

const pdbrColor = "bg-gray-100";
const pdbrBorder = "border-gray-300";
const pdbrColorHover = "group-hover:bg-gray-200";

export const TranslationExample: React.FC = () => {
  const [translationSystem, setTranslationSystem] = useState<TranslationSystem | null>(null);
  const [translation, setTranslation] = useState<TranslationValues | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdbrRef = useRef<HTMLDivElement>(null);
  const pageTableRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activePfnCellRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const tableElementRefs = useRef<(HTMLTableElement | null)[]>([]);
  const finalPfnBlockRef = useRef<HTMLDivElement>(null);

  const pageTableLevels: PageTableLevel[] = [
    { indexBits: 8, label: "PD Index" },
    { indexBits: 8, label: "PT Index" }
  ];

  useEffect(() => {
    const system = new TranslationSystem(
      PhysicalMemorySize.KB_32,
      PageSize.B_256,
      pageTableLevels
    );
    setTranslationSystem(system);
    setTranslation(system.generateTranslation());
  }, []);

  const drawArrows = useCallback(() => {
    if (!svgRef.current || !translation || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Arrow from PDBR to the first Page Table (3-segment orthogonal)
    if (pdbrRef.current && tableElementRefs.current[0]) {
      const pdbrBlockElement = pdbrRef.current.querySelector(".group"); // Get the actual block element
      if (pdbrBlockElement) {
        const pdbrRect = pdbrBlockElement.getBoundingClientRect();
        const firstTableRect = tableElementRefs.current[0].getBoundingClientRect();

        const startX = pdbrRect.right + 10 - containerRect.left; // Start 10px to the right of PDBR block
        const startY = pdbrRect.top + pdbrRect.height / 2 - containerRect.top; // Mid-point of PDBR block vertically
        const endX = firstTableRect.left - containerRect.left - 10; // End 10px to the left of the table
        const endY = firstTableRect.top - containerRect.top; // Top of the table
        
        const midPointX = startX + (endX - startX) * 0.5;

        svg.append("path")
          .attr("d", `M ${startX} ${startY} L ${midPointX} ${startY} L ${midPointX} ${endY} L ${endX} ${endY}`)
          .attr("stroke", "#9ca3af")
          .attr("stroke-width", 1)
          .attr("fill", "none")
          .attr("marker-end", "url(#arrowhead)");
      }
    }

    for (let i = 0; i < translation.pageTables.length - 1; i++) {
      const activePfnCell = activePfnCellRefs.current[i];
      const nextTable = tableElementRefs.current[i + 1];
      if (activePfnCell && nextTable) {
        const pfnCellRect = activePfnCell.getBoundingClientRect();
        const nextTableRect = nextTable.getBoundingClientRect();
        const startX = pfnCellRect.right + 10 - containerRect.left;
        const startY = pfnCellRect.top + pfnCellRect.height / 2 - containerRect.top;
        const endX = nextTableRect.left - containerRect.left - 10;
        const endY = nextTableRect.top - containerRect.top;
        const midPointX = startX + (endX - startX) * 0.5;
        svg.append("path")
          .attr("d", `M ${startX} ${startY} L ${midPointX} ${startY} L ${midPointX} ${endY} L ${endX} ${endY}`)
          .attr("stroke", "#9ca3af").attr("stroke-width", 1).attr("fill", "none").attr("marker-end", "url(#arrowhead)");
      }
    }

    // Arrow from last PFN cell to final PFN block
    if (activePfnCellRefs.current.length > 0 && finalPfnBlockRef.current && tableElementRefs.current.length > 0) {
      const lastPfnCellIndex = translation.pageTables.length - 1;
      const lastActivePfnCell = activePfnCellRefs.current[lastPfnCellIndex];
      const finalPfnBlockElement = finalPfnBlockRef.current.querySelector(".group"); // Get the actual block element

      if (lastActivePfnCell && finalPfnBlockElement) {
        const pfnCellRect = lastActivePfnCell.getBoundingClientRect();
        const finalBlockRect = finalPfnBlockElement.getBoundingClientRect();

        const startX = pfnCellRect.right + 10 - containerRect.left;
        const startY = pfnCellRect.top + pfnCellRect.height / 2 - containerRect.top;
        const endX = finalBlockRect.left - containerRect.left - 10;
        const endY = finalBlockRect.top + finalBlockRect.height / 2 - containerRect.top;
        
        // For a direct horizontal arrow, or a simple 3-segment if vertical alignment differs significantly
        // We can simplify to a straight line if Y positions are close, or use a slight bend.
        // For now, let's use a similar 3-segment approach for consistency, adjusting the middle point if needed.
        const midPointX = startX + (endX - startX) * 0.5;


        // If startY and endY are very similar, a straight line might be better.
        // However, the existing logic uses a 3-segment path, let's adapt that.
        // If vertical positions are roughly aligned, make the vertical segment minimal or non-existent.
        if (Math.abs(startY - endY) < 20) { // Threshold for "roughly aligned"
             svg.append("path")
            .attr("d", `M ${startX} ${startY} L ${endX} ${endY}`) // Straight line
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead)");
        } else {
            svg.append("path")
            .attr("d", `M ${startX} ${startY} L ${midPointX} ${startY} L ${midPointX} ${endY} L ${endX} ${endY}`)
            .attr("stroke", "#9ca3af")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead)");
        }
      }
    }

    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10).attr("markerHeight", 7)
      .attr("refX", 9).attr("refY", 3.5).attr("orient", "auto")
      .append("polygon").attr("points", "0 0, 10 3.5, 0 7").attr("fill", "#9ca3af");
  }, [translation, translationSystem]);

  useEffect(() => {
    // Initial draw
    const initialTimer = setTimeout(drawArrows, 100);

    // Debounced resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawArrows();
      }, 150); // Debounce timeout of 150ms
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawArrows]);

  const generateNewTranslation = () => {
    if (translationSystem) setTranslation(translationSystem.generateTranslation());
  };

  if (!translationSystem || !translation) return <div>Loading...</div>;

  const systemInfo = translationSystem.getSystemInfo();
  const breakdown = translationSystem.getVirtualAddressBreakdown(translation);
  
  // Calculate start bit numbers for Virtual Address components
  const vaBitCalculations = breakdown.indices.map((level, i) => {
    let startBit = breakdown.offset.bits.length;
    for (let k = i + 1; k < breakdown.indices.length; k++) {
      startBit += breakdown.indices[k].bits.length;
    }
    return { ...level, startBit };
  });

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-24">
      <section className="w-full max-w-6xl">
        <SectionHeading>Virtual Address Translation</SectionHeading>
        <p className="text-muted-foreground mt-2 mb-6">
          This visualization demonstrates a step-by-step virtual to physical address translation process using hierarchical page tables.
          Click the button to generate a new random translation scenario.
        </p>
        <div className="flex justify-start">
          <Button onClick={generateNewTranslation} className="w-fit">Generate New Translation</Button>
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="bg-muted/50 rounded-lg p-6">
          <SubsectionHeading>Virtual Address ({breakdown.indices.reduce((sum, item) => sum + item.bits.length, 0) + breakdown.offset.bits.length} bits): {TranslationSystem.toHex(translation.virtualAddress, 4)}</SubsectionHeading>
          <div className="flex items-center justify-center gap-2">
            {vaBitCalculations.map((level, i) => (
              <BinaryBlock
                key={`va-level-${i}`}
                blocks={level.bits.length}
                digits={level.bits.split('')}
                color={PageTableLevelColors[i % PageTableLevelColors.length].background}
                borderColor={PageTableLevelColors[i % PageTableLevelColors.length].border}
                hoverColor={PageTableLevelColors[i % PageTableLevelColors.length].hover}
                label={`${level.label} (${level.value})`}
                showBitNumbers={true}
                showLeftBorder={true}
                startBitNumber={level.startBit}
                tooltip={
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
                }
              />
            ))}
            <BinaryBlock
              key="va-offset"
              blocks={breakdown.offset.bits.length}
              digits={breakdown.offset.bits.split('')}
              color={virtualOffsetColor}
              borderColor={virtualOffsetBorder}
              hoverColor={virtualOffsetColorHover}
              label={`Offset (${breakdown.offset.value})`}
              showBitNumbers={true}
              showLeftBorder={true}
              startBitNumber={0}
              tooltip={
                <div className="max-w-sm space-y-1">
                  <p className="text-sm font-medium">
                    Page Offset ({breakdown.offset.bits.length} bits)
                  </p>
                  <p className="text-xs">
                    Byte position within the page. Copied directly to physical address
                    without translation.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="bg-muted/50 rounded-lg p-6">
          <SubsectionHeading>Address Translation Process</SubsectionHeading>
          <div className="flex flex-col gap-8">
            <div className="relative" ref={containerRef}>
              <div className="flex items-start justify-center gap-16 overflow-x-auto">
                <div ref={pdbrRef} className="my-auto flex-shrink-0 flex flex-col items-center">
                  <BinaryBlock
                    blocks={1}
                    color={pdbrColor}
                    borderColor={pdbrBorder}
                    hoverColor={pdbrColorHover}
                    label="PDBR"
                    showBitNumbers={false}
                    showLeftBorder={true}
                    tooltip={
                      <div className="max-w-xs space-y-1 text-left">
                        <p className="text-sm font-medium">
                          PDBR: {TranslationSystem.toHex(translation.pdbr)} (Decimal: {translation.pdbr})
                        </p>
                        <p className="text-xs">
                          Points to the first-level page table's PFN.
                        </p>
                      </div>
                    }
                  />
                </div>

                {translation.pageTables.map((pageTable, levelIndex) => (
                  <div 
                    key={levelIndex} 
                    className="flex-shrink-0 flex flex-col"
                    ref={(el) => { pageTableRefs.current[levelIndex] = el; }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h4 className="text-left text-sm font-medium mb-1">
                            <span className="cursor-help border-muted-foreground/50 hover:border-muted-foreground border-b border-dotted transition-colors">
                              PFN: {pageTable.tablePfn}
                            </span>
                          </h4>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            This is the page table located at PFN {pageTable.tablePfn}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Table 
                      className="w-auto border"
                      ref={(el) => { tableElementRefs.current[levelIndex] = el; }}
                    >
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center border-r w-16">Index</TableHead>
                          <TableHead className="text-center border-r w-16">Valid</TableHead>
                          <TableHead className="text-center w-16">PFN</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const correctIndex = translation.virtualIndices[levelIndex];
                          const displayData = translationSystem.getDisplayEntries(pageTable, correctIndex);
                          const hasMoreAbove = displayData.startIndex > 0;
                          const hasMoreBelow = displayData.endIndex < pageTable.entries.length - 1;
                          const rows = [];
                          if (hasMoreAbove) {
                            rows.push(
                              <TableRow key="ellipsis-above">
                                <TableCell className="text-center text-gray-400 border-r">⋮</TableCell>
                                <TableCell className="text-center text-gray-400 border-r">⋮</TableCell>
                                <TableCell className="text-center text-gray-400">⋮</TableCell>
                              </TableRow>
                            );
                          }
                          displayData.entries.forEach(({ entry, index, isCorrect }) => {
                            const levelColors = PageTableLevelColors[levelIndex % PageTableLevelColors.length];
                            const rowClasses = isCorrect
                              ? `group ${levelColors.background} ${levelColors.hover.replace("group-hover:", "hover:")}`
                              : 'hover:bg-muted/25';

                            rows.push(
                              <TableRow 
                                key={index}
                                className={rowClasses}
                              >
                                <TableCell className={`text-center font-mono border-r ${isCorrect ? levelColors.border : 'border-border'}`}>{index}</TableCell>
                                <TableCell className={`text-center font-mono border-r ${isCorrect ? levelColors.border : 'border-border'}`}>{entry.valid ? '1' : '0'}</TableCell>
                                <TableCell 
                                  className={`text-center font-mono ${isCorrect ? levelColors.border : 'border-border'}`}
                                  ref={isCorrect ? (el) => { activePfnCellRefs.current[levelIndex] = el; } : undefined}
                                >
                                  {entry.valid ? entry.pfn : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          });
                          if (hasMoreBelow) {
                            rows.push(
                              <TableRow key="ellipsis-below">
                                <TableCell className="text-center text-gray-400 border-r">⋮</TableCell>
                                <TableCell className="text-center text-gray-400 border-r">⋮</TableCell>
                                <TableCell className="text-center text-gray-400">⋮</TableCell>
                              </TableRow>
                            );
                          }
                          return rows;
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                ))}
                <div ref={finalPfnBlockRef} className="my-auto flex-shrink-0 flex flex-col items-center">
                  <BinaryBlock
                    blocks={1}
                    color={physicalPfnColor}
                    borderColor={physicalPfnBorder}
                    hoverColor={physicalPfnColorHover}
                    label="PFN"
                    showBitNumbers={false}
                    showLeftBorder={true}
                    tooltip={
                      <div className="max-w-xs space-y-1 text-left">
                        <p className="text-sm font-medium">
                          Final PFN: {TranslationSystem.toHex(translation.finalPfn)} (Decimal: {translation.finalPfn})
                        </p>
                        <p className="text-xs">
                          This is the Page Frame Number of the physical memory page for the above virtual address.
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>
              <svg ref={svgRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}/>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="bg-muted/50 rounded-lg p-6">
          <SubsectionHeading>Physical Address ({systemInfo.pfnBits + systemInfo.offsetBits} bits): {TranslationSystem.toHex(translation.physicalAddress, 4)}</SubsectionHeading>
          <div className="flex items-center justify-center gap-2">
            <BinaryBlock
              key="pa-pfn"
              blocks={systemInfo.pfnBits}
              digits={TranslationSystem.toBinary(translation.finalPfn, systemInfo.pfnBits).split('')}
              color={physicalPfnColor}
              borderColor={physicalPfnBorder}
              hoverColor={physicalPfnColorHover}
              label={`PFN (${translation.finalPfn})`}
              showBitNumbers={true}
              showLeftBorder={true}
              startBitNumber={systemInfo.offsetBits}
              tooltip={
                <div className="max-w-sm space-y-1">
                  <p className="text-sm font-medium">
                    Physical Frame Number ({systemInfo.pfnBits} bits)
                  </p>
                  <p className="text-xs">
                    Identifies which physical memory frame contains the page data. Comes from
                    the PTE.
                  </p>
                </div>
              }
            />
            <BinaryBlock
              key="pa-offset"
              blocks={systemInfo.offsetBits}
              digits={TranslationSystem.toBinary(breakdown.offset.value, systemInfo.offsetBits).split('')}
              color={virtualOffsetColor}
              borderColor={virtualOffsetBorder}
              hoverColor={virtualOffsetColorHover}
              label={`Offset (${breakdown.offset.value})`}
              showBitNumbers={true}
              showLeftBorder={true}
              startBitNumber={0}
              tooltip={
                <div className="max-w-sm space-y-1">
                  <p className="text-sm font-medium">Page Offset ({systemInfo.offsetBits} bits)</p>
                  <p className="text-xs">
                    Same offset from virtual address. Passes through unchanged during
                    translation.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </section>

    </div>
  );
}; 