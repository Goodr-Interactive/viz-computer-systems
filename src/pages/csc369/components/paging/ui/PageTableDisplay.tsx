import React from "react";
import { motion } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageTableLevelColors } from "../constants";
import type { PageTableEntry } from "../TranslationSystemNew"; // Assuming PageTableEntry type is exportable

// This type might need to be refined or imported if it exists elsewhere
interface DisplayEntry {
  entry: PageTableEntry;
  index: number;
  isCorrect: boolean;
}

interface DisplayData {
  entries: DisplayEntry[];
  startIndex: number;
  endIndex: number;
}

interface PageTableDisplayProps {
  levelIndex: number;
  pageTablePfn: number; // PFN of this specific page table, for the heading
  tableDisplayData: DisplayData; // The processed entries to display (subset with ellipsis logic)
  totalEntriesInTable: number; // For ellipsis logic comparison
  selectedEntriesForTest: Array<number | null>; // To know if this level's correct entry has been selected
  testMode: boolean;
  showHex: boolean;
  formatNumber: (num: number, padLength?: number) => string;
  handleEntrySelection: (levelIndex: number, entryIndex: number) => void;

  // Refs for arrow drawing - these will be forwarded or managed by the parent visualizer
  pageTableContainerRef?: (el: HTMLDivElement | null) => void;
  pageTableElementRef?: (el: HTMLTableElement | null) => void;
  activePfnCellRef?: (el: HTMLTableCellElement | null) => void;

  // Animation props - passed from parent visualizer
  isVisible: boolean;
  onAnimationStart: () => void;
  onAnimationComplete: () => void;
  onLayoutAnimationComplete: () => void;
}

export const PageTableDisplay: React.FC<PageTableDisplayProps> = ({
  levelIndex,
  pageTablePfn,
  tableDisplayData,
  totalEntriesInTable,
  selectedEntriesForTest,
  testMode,
  showHex,
  formatNumber,
  handleEntrySelection,
  pageTableContainerRef,
  pageTableElementRef,
  activePfnCellRef,
  isVisible,
  onAnimationStart,
  onAnimationComplete,
  onLayoutAnimationComplete,
}) => {
  const levelColors = PageTableLevelColors[levelIndex % PageTableLevelColors.length];
  
  // Check if this is the final page table (has RWX bits)
  const isFinalPageTable = tableDisplayData?.entries?.some(({ entry }) => entry.rwx !== null) || false;

  return (
    <motion.div
      className="flex flex-shrink-0 flex-col"
      ref={pageTableContainerRef}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut" },
        layout: { duration: 0.3 },
      }}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <h4 className="ml-[64px] mb-1 text-sm font-medium">
              <span className="border-muted-foreground/50 hover:border-muted-foreground cursor-help border-b border-dotted transition-colors">
                PFN: {formatNumber(pageTablePfn)}
              </span>
            </h4>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              This is the page table located at PFN {formatNumber(pageTablePfn)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Table className="w-auto" ref={pageTableElementRef}>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="border-0">
            <TableHead className="w-16 text-right text-xs text-muted-foreground pr-2 font-mono"></TableHead>
            <TableHead className="w-16 border text-center font-medium">Valid</TableHead>
            {isFinalPageTable && (
              <TableHead className="w-16 border text-center font-medium">RWX</TableHead>
            )}
            <TableHead className="w-16 border text-center font-medium">PFN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            if (!tableDisplayData) return null;

            // Inline ellipses logic - show ellipses if there are entries before/after the displayed range
            const hasMoreAbove = tableDisplayData.startIndex > 0;
            const hasMoreBelow = tableDisplayData.endIndex < totalEntriesInTable - 1;
            const rows = [];

            if (hasMoreAbove) {
              rows.push(
                <TableRow key="ellipsis-above" className="border-0">
                  <TableCell className="text-left text-gray-400"></TableCell>
                  <TableCell className="border text-center text-gray-400">⋮</TableCell>
                  {isFinalPageTable && (
                    <TableCell className="border text-center text-gray-400">⋮</TableCell>
                  )}
                  <TableCell className="border text-center text-gray-400">⋮</TableCell>
                </TableRow>
              );
            }

            tableDisplayData.entries.forEach(({ entry, index, isCorrect }) => {
              const showAsCorrect = testMode
                ? selectedEntriesForTest[levelIndex] === index
                : isCorrect;
              const isClickable = testMode && !selectedEntriesForTest[levelIndex];

              let hoverClass = "group-hover:bg-gray-200/50";
              if (showAsCorrect) {
                if (levelColors.hover.includes("indigo")) hoverClass = "group-hover:bg-indigo-200";
                else if (levelColors.hover.includes("purple")) hoverClass = "group-hover:bg-purple-200";
                else if (levelColors.hover.includes("pink")) hoverClass = "group-hover:bg-pink-200";
              }

              const rowClasses = `group transition-colors border-b-0 ${isClickable ? "cursor-pointer" : ""}`;

              rows.push(
                <TableRow
                  key={index}
                  className={rowClasses}
                  onClick={isClickable ? () => handleEntrySelection(levelIndex, index) : undefined}
                >
                  <TableCell className="border-0 text-xs text-right pr-3 font-mono text-muted-foreground">
                    {formatNumber(index, showHex ? 2 : undefined)}
                  </TableCell>
                  <TableCell className={`border text-center font-mono border-border ${showAsCorrect ? `${levelColors.background}` : ""} ${hoverClass}`}>
                    {entry.valid ? "1" : "0"}
                  </TableCell>
                  {isFinalPageTable && (
                    <TableCell className={`border text-center font-mono border-border ${showAsCorrect ? `${levelColors.background}` : ""} ${hoverClass}`}>
                      {entry.valid && entry.rwx !== null ? (entry.rwx).toString(2).padStart(3, '0') : "---"}
                    </TableCell>
                  )}
                  <TableCell
                    className={`border text-center font-mono border-border ${showAsCorrect ? `${levelColors.background}` : ""} ${hoverClass}`}
                    ref={showAsCorrect ? activePfnCellRef : undefined}
                  >
                    {entry.valid ? formatNumber(entry.pfn!) : "-"}
                  </TableCell>
                </TableRow>
              );
            });

            if (hasMoreBelow) {
              rows.push(
                <TableRow key="ellipsis-below" className="border-0">
                  <TableCell className="border-0 text-center text-gray-400"></TableCell>
                  <TableCell className="border text-center text-gray-400">⋮</TableCell>
                  {isFinalPageTable && (
                    <TableCell className="border text-center text-gray-400">⋮</TableCell>
                  )}
                  <TableCell className="border text-center text-gray-400">⋮</TableCell>
                </TableRow>
              );
            }
            return rows;
          })()}
        </TableBody>
      </Table>
    </motion.div>
  );
};
