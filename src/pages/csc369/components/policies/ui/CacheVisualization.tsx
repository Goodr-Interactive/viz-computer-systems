import React from "react";
import { motion } from "motion/react";
import { BinaryBlock } from "../../paging/ui/BinaryBlock";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
  evictedFromQueue?: 'A1' | 'Am';
  className?: string;
}

export const CacheVisualization: React.FC<CacheVisualizationProps> = ({
  policyName,
  slots,
  capacity,
  currentAccess,
  isHit,
  evictedValue,
  insertedValue,
  clockHand,
  randomSlotSelected,
  evictedFromQueue,
  className,
}) => {
  const getSlotColor = (slot: CacheSlot, index: number): string => {
    // Highlight clock hand for Clock algorithm (always show, even for empty slots)
    if (policyName === 'Clock' && clockHand === index) {
      return "bg-yellow-100";
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
    if (policyName === 'Clock' && clockHand === index) {
      return "hover:bg-yellow-200";
    }

    if (slot.isEmpty) {
      return "hover:bg-gray-200";
    }

    // Highlight current access
    if (currentAccess && slot.value === currentAccess) {
      return isHit ? "hover:bg-yellow-200" : "hover:bg-blue-200";
    }

    // Regular blocks
    return "hover:bg-gray-200";
  };

  const getSlotBorderColor = (slot: CacheSlot, index: number): string => {
    // Highlight clock hand for Clock algorithm (always show, even for empty slots)
    if (policyName === 'Clock' && clockHand === index) {
      return "border-yellow-500";
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

  const getSlotLabel = (slot: CacheSlot, index: number): string | null => {
    if (slot.isEmpty) return null;

    let label = '';
    
    switch (policyName) {
      case 'LRU':
        if (slot.isLRU) label += "LRU";
        if (slot.isMRU) label += "MRU";
        break;
      case 'FIFO':
        if (slot.isOldest) label += "Oldest";
        if (slot.isNewest) label += "Newest";
        break;
      case 'Clock':
        // Remove "Clock" text label - now shown with color instead
        if (slot.referenceBit !== undefined) {
          label += `R:${slot.referenceBit ? '1' : '0'}`;
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
      case 'LRU':
        if (slot.lastAccessTime !== undefined) {
          tooltip += `\nLast access: ${slot.lastAccessTime}`;
        }
        if (slot.isLRU) tooltip += '\n(Least Recently Used)';
        if (slot.isMRU) tooltip += '\n(Most Recently Used)';
        break;
      case 'FIFO':
        if (slot.insertionOrder !== undefined) {
          tooltip += `\nInsertion order: ${slot.insertionOrder}`;
        }
        if (slot.isOldest) tooltip += '\n(Oldest - will be evicted next)';
        if (slot.isNewest) tooltip += '\n(Newest)';
        break;
      case 'Clock':
        if (slot.referenceBit !== undefined) {
          tooltip += `\nReference bit: ${slot.referenceBit ? '1' : '0'}`;
        }
        if (clockHand === index) tooltip += '\n(Clock hand points here)';
        break;
      case 'Random':
        if (randomSlotSelected === index) {
          tooltip += '\n(Randomly selected for eviction)';
        }
        break;
      case 'Optimal':
        tooltip += '\n(Optimal replacement)';
        break;
      case '2Q':
        tooltip += '\n(2Q cache)';
        break;
    }

    return tooltip;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Cache Slots */}
      <TooltipProvider>
        <div className="flex flex-wrap gap-3 min-h-15 mt-2">
          {slots.map((slot, index) => (
            <Tooltip key={index} delayDuration={350}>
              <TooltipTrigger asChild>
                <motion.div
                  className="relative"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BinaryBlock
                    blocks={1}
                    color={getSlotColor(slot, index)}
                    borderColor={getSlotBorderColor(slot, index)}
                    hoverColor={getSlotHoverColor(slot, index)}
                    digits={slot.isEmpty ? [''] : [String(slot.value)]}
                    label={getSlotLabel(slot, index)}
                    showBitNumbers={false}
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="whitespace-pre-line">{getSlotTooltip(slot, index)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}; 