// Cache display item interface
interface CacheDisplayItem {
  index: number;
  value: string;
  lastAccessTime?: number | null;
  insertionOrder?: number | null;
  isLRU?: boolean;
  isMRU?: boolean;
  isOldest?: boolean;
  isNewest?: boolean;
  isEmpty: boolean;
  referenceBit?: boolean;
  isClockHand?: boolean;
}

// Cache state interface
interface CacheState {
  displayInfo: CacheDisplayItem[];
  values: Array<string | number | null>;
  clockHand?: number;
}

// Cache result interface
interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity";
  randomSlotSelected?: number;
  evictedFromQueue?: "A1" | "Am";
}

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

export function convertCacheStateToSlots(cacheState: CacheState, capacity: number): CacheSlot[] {
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
    cacheState.displayInfo.forEach((item: CacheDisplayItem, index: number) => {
      if (index < capacity) {
        const value = item.value === "---" ? null : item.value;
        slots[index] = {
          value,
          isEmpty: value === null,
          // LRU specific
          lastAccessTime: item.lastAccessTime ?? undefined,
          isLRU: item.isLRU,
          isMRU: item.isMRU,
          // FIFO specific
          insertionOrder: item.insertionOrder ?? undefined,
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

export function getClockHand(cacheState: CacheState): number | undefined {
  // Try to get clock hand position from cache state
  if (cacheState.displayInfo && Array.isArray(cacheState.displayInfo)) {
    const clockHandSlot = cacheState.displayInfo.find((item: CacheDisplayItem) => item.isClockHand);
    if (clockHandSlot) {
      return clockHandSlot.index;
    }
  }
  return cacheState.clockHand;
}

export function getRandomSlotSelected(cacheResult: CacheResult | null): number | undefined {
  return cacheResult?.randomSlotSelected;
}

export function getEvictedFromQueue(cacheResult: CacheResult | null): "A1" | "Am" | undefined {
  return cacheResult?.evictedFromQueue;
}
