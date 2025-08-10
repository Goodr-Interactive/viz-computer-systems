import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { BinaryBlock } from "../../paging/ui/BinaryBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CacheSlot {
  value: string | number | null;
  isEmpty: boolean;
  // LRU/FIFO specific
  lastAccessTime?: number;
  insertionOrder?: number;
  // Clock specific
  referenceBit?: boolean;
  // Display info
  isLRU?: boolean;
  isOldest?: boolean;
  isMRU?: boolean;
  isNewest?: boolean;
}

interface CacheVisualizationProps {
  policyName: string;
  slots: CacheSlot[];
  capacity: number;
  currentAccess?: string | number | null;
  isHit?: boolean;
  evictedValue?: string | number | null;
  insertedValue?: string | number | null;
  // Clock specific
  clockHand?: number;
  // Random specific
  randomSlotSelected?: number;
  // 2Q specific
  evictedFromQueue?: "A1" | "Am";
  className?: string;
}

export const CacheVisualization: React.FC<CacheVisualizationProps> = ({
  policyName,
  slots,
  currentAccess,
  isHit,
  clockHand,
  className,
}) => {
  const getSlotColor = (slot: CacheSlot, index: number): string => {
    // Highlight clock hand for Clock algorithm (always show, even for empty slots)
    if (policyName === "Clock" && clockHand === index) {
      return "bg-violet-100";
    }

    if (slot.isEmpty) {
      return "bg-gray-100";
    }

    // Highlight current access
    if (currentAccess && slot.value === currentAccess) {
      return isHit ? "bg-green-100" : "bg-blue-100";
    }

    // Regular blocks
    return "bg-gray-100";
  };

  const getSlotHoverColor = (slot: CacheSlot, index: number): string => {
    // Highlight clock hand for Clock algorithm (always show, even for empty slots)
    if (policyName === "Clock" && clockHand === index) {
      return "hover:bg-violet-200";
    }

    if (slot.isEmpty) {
      return "hover:bg-gray-200";
    }

    // Highlight current access
    if (currentAccess && slot.value === currentAccess) {
      return isHit ? "hover:bg-green-200" : "hover:bg-blue-200";
    }

    // Regular blocks
    return "hover:bg-gray-200";
  };

  const getSlotBorderColor = (slot: CacheSlot, index: number): string => {
    // Highlight clock hand for Clock algorithm (always show, even for empty slots)
    if (policyName === "Clock" && clockHand === index) {
      return "border-violet-300";
    }

    if (slot.isEmpty) {
      return "border-gray-300";
    }

    // Highlight current access
    if (currentAccess && slot.value === currentAccess) {
      return isHit ? "border-green-300" : "border-blue-300";
    }

    // Regular blocks
    return "border-gray-300";
  };

  const getSlotLabel = (slot: CacheSlot): string | null => {
    if (slot.isEmpty) return null;

    let label = "";

    switch (policyName) {
      case "LRU":
        if (slot.isLRU) label += "LRU";
        if (slot.isMRU) label += "MRU";
        break;
      case "FIFO":
        if (slot.isOldest) label += "First";
        if (slot.isNewest) label += "Last";
        break;
      case "Clock":
        // Remove "Clock" text label - now shown with color instead
        if (slot.referenceBit !== undefined) {
          label += `U:${slot.referenceBit ? "1" : "0"}`;
        }
        break;
    }

    return label || null;
  };

  const getSlotTooltip = (slot: CacheSlot, index: number): string => {
    if (slot.isEmpty) {
      return `Slot ${index}: Empty`;
    }

    let tooltip = `Slot ${index}: ${slot.value}`;

    switch (policyName) {
      case "Clock":
        if (slot.referenceBit !== undefined) {
          tooltip += `\nUse bit: ${slot.referenceBit ? "1" : "0"}`;
        }
        break;
    }

    return tooltip;
  };

  const isCacheEmpty = slots.every((slot) => slot.isEmpty);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {isCacheEmpty ? (
          <motion.div
            key="cache-empty-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="origin-top"
          >
            <div className="mt-2 flex min-h-15 items-center justify-center">
              <p className="text-muted-foreground -mt-1">
                Step through the page accesses to see the cache state
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cache-slots-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <TooltipProvider>
              <div className="mt-2 flex min-h-15 flex-wrap gap-3 overflow-hidden">
                <AnimatePresence initial={false}>
                  {slots.map((slot, index) =>
                    slot.value ? (
                      <motion.div
                        key={slot.value ? String(slot.value) : `empty-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.5,
                          transition: { duration: 0.15 },
                        }}
                        transition={{
                          type: "tween",
                          ease: "easeInOut",
                          duration: 0.2,
                        }}
                        className="relative"
                      >
                        <Tooltip delayDuration={350}>
                          <TooltipTrigger asChild>
                            <div>
                              <BinaryBlock
                                blocks={1}
                                color={getSlotColor(slot, index)}
                                borderColor={getSlotBorderColor(slot, index)}
                                hoverColor={getSlotHoverColor(slot, index)}
                                digits={slot.isEmpty ? ["-"] : [String(slot.value)]}
                                label={getSlotLabel(slot)}
                                showBitNumbers={false}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="whitespace-pre-line">{getSlotTooltip(slot, index)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
              </div>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
