import type { PagingPolicyName } from "../CompareController";

export interface CacheSlot {
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

export function convertCacheStateToSlots(
  policyName: PagingPolicyName,
  cacheState: any,
  capacity: number
): CacheSlot[] {
  const slots: CacheSlot[] = [];
  
  // Initialize empty slots
  for (let i = 0; i < capacity; i++) {
    slots.push({
      value: null,
      isEmpty: true,
    });
  }

  // If we have display info, use it to populate slots
  if (cacheState.displayInfo && Array.isArray(cacheState.displayInfo)) {
    cacheState.displayInfo.forEach((item: any, index: number) => {
      if (index < capacity) {
        const value = item.value === '---' ? null : item.value;
        slots[index] = {
          value,
          isEmpty: value === null,
          // LRU specific
          lastAccessTime: item.lastAccessTime,
          isLRU: item.isLRU,
          isMRU: item.isMRU,
          // FIFO specific
          insertionOrder: item.insertionOrder,
          isOldest: item.isOldest,
          isNewest: item.isNewest,
          // Clock specific
          referenceBit: item.referenceBit,
        };
      }
    });
  }

  return slots;
}

export function getClockHand(cacheState: any): number | undefined {
  // Try to get clock hand position from cache state
  if (cacheState.displayInfo && Array.isArray(cacheState.displayInfo)) {
    const clockHandSlot = cacheState.displayInfo.find((item: any) => item.isClockHand);
    if (clockHandSlot) {
      return clockHandSlot.index;
    }
  }
  return cacheState.clockHand;
}

export function getRandomSlotSelected(cacheResult: any): number | undefined {
  return cacheResult?.randomSlotSelected;
}

export function getEvictedFromQueue(cacheResult: any): 'A1' | 'Am' | undefined {
  return cacheResult?.evictedFromQueue;
} 