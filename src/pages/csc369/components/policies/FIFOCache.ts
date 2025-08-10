export interface CacheSlot {
  value: string | number | null;
  insertionOrder: number;
  isEmpty: boolean;
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity"; // Only present on miss
}

export class FIFOCache {
  private slots: CacheSlot[];
  private capacity: number;
  private insertionCounter = 0;
  private accessCounter = 0;
  private hitCount = 0;
  private missCount = 0;
  private coldMissCount = 0;
  private capacityMissCount = 0;

  // Track all values that have ever been in the cache
  private everSeen = new Set<string | number>();

  constructor(capacity = 10) {
    this.capacity = capacity;
    this.slots = Array(capacity)
      .fill(null)
      .map(() => ({
        value: null,
        insertionOrder: 0,
        isEmpty: true,
      }));
  }

  /**
   * Check if a value is in cache and add it if not present
   * Returns whether it was a hit or miss, plus eviction info
   *
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and eviction details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;

    // Check for cache hit
    const hitSlot = this.slots.find((slot) => !slot.isEmpty && slot.value === value);

    if (hitSlot) {
      // Cache hit!
      this.hitCount++;
      return {
        hit: true,
      };
    }

    // Cache miss - determine if it's cold or capacity miss
    this.missCount++;

    const isColdMiss = !this.everSeen.has(value);
    const missType: "cold" | "capacity" = isColdMiss ? "cold" : "capacity";

    if (isColdMiss) {
      this.coldMissCount++;
    } else {
      this.capacityMissCount++;
    }

    // Track that we've now seen this value
    this.everSeen.add(value);

    this.insertionCounter++;

    // Find an empty slot first
    let targetSlot = this.slots.find((slot) => slot.isEmpty);
    let evictedValue: string | number | undefined;

    if (!targetSlot) {
      // All slots are occupied, need to evict using FIFO
      // Find the slot with the smallest insertionOrder (oldest)
      targetSlot = this.slots.reduce((oldest, current) => {
        return current.insertionOrder < oldest.insertionOrder ? current : oldest;
      });

      // Store the evicted value
      evictedValue = targetSlot.value!;
    }

    // Insert new value
    targetSlot.value = value;
    targetSlot.insertionOrder = this.insertionCounter;
    targetSlot.isEmpty = false;

    return {
      hit: false,
      evictedValue,
      insertedValue: value,
      missType,
    };
  }

  /**
   * Get current cache state for visualization
   */
  getCacheState(): CacheSlot[] {
    return [...this.slots];
  }

  /**
   * Get cache statistics including miss type breakdown
   */
  getStats() {
    return {
      totalAccesses: this.accessCounter,
      hits: this.hitCount,
      misses: this.missCount,
      coldMisses: this.coldMissCount,
      capacityMisses: this.capacityMissCount,
      hitRate: this.accessCounter > 0 ? this.hitCount / this.accessCounter : 0,
      coldMissRate: this.accessCounter > 0 ? this.coldMissCount / this.accessCounter : 0,
      capacityMissRate: this.accessCounter > 0 ? this.capacityMissCount / this.accessCounter : 0,
      capacity: this.capacity,
      occupancy: this.slots.filter((slot) => !slot.isEmpty).length,
      uniqueValuesSeen: this.everSeen.size,
    };
  }

  /**
   * Get the value that would be evicted next (oldest)
   */
  getNextEvictionValue(): string | number | null {
    const occupiedSlots = this.slots.filter((slot) => !slot.isEmpty);
    if (occupiedSlots.length === 0) {
      return null;
    }

    const oldestSlot = occupiedSlots.reduce((oldest, current) => {
      return current.insertionOrder < oldest.insertionOrder ? current : oldest;
    });

    return oldestSlot.value;
  }

  /**
   * Check if cache is full
   */
  isFull(): boolean {
    return this.slots.every((slot) => !slot.isEmpty);
  }

  /**
   * Check if a value has ever been seen before (useful for UI)
   */
  hasSeenBefore(value: string | number): boolean {
    return this.everSeen.has(value);
  }

  /**
   * Reset cache to empty state
   */
  reset(): void {
    this.slots.forEach((slot) => {
      slot.value = null;
      slot.insertionOrder = 0;
      slot.isEmpty = true;
    });
    this.insertionCounter = 0;
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.coldMissCount = 0;
    this.capacityMissCount = 0;
    this.everSeen.clear();
  }

  /**
   * Get cache contents formatted for display, sorted by FIFO order
   */
  getDisplayInfo(): Array<{
    index: number;
    value: string;
    insertionOrder: number | null;
    isOldest: boolean;
    isNewest: boolean;
    isEmpty: boolean;
  }> {
    const nextEviction = this.getNextEvictionValue();

    // Find the newest item (highest insertion order)
    const occupiedSlots = this.slots.filter((slot) => !slot.isEmpty);
    let newestValue: string | number | null = null;
    if (occupiedSlots.length > 1) {
      const newestSlot = occupiedSlots.reduce((newest, current) => {
        return current.insertionOrder > newest.insertionOrder ? current : newest;
      });
      newestValue = newestSlot.value;
    }

    // Map slots to display info with original index
    const displayItems = this.slots.map((slot, index) => ({
      index,
      value: slot.isEmpty ? "---" : String(slot.value),
      insertionOrder: slot.isEmpty ? null : slot.insertionOrder,
      isOldest: !slot.isEmpty && slot.value === nextEviction,
      isNewest: !slot.isEmpty && slot.value === newestValue,
      isEmpty: slot.isEmpty,
    }));

    // Sort by FIFO order: empty slots first, then by insertion order (oldest first)
    return displayItems.sort((a, b) => {
      // Empty slots go to the end
      if (a.isEmpty && !b.isEmpty) return 1;
      if (!a.isEmpty && b.isEmpty) return -1;
      if (a.isEmpty && b.isEmpty) return a.index - b.index; // Keep original order for empty slots

      // Sort occupied slots by insertion order (oldest first = FIFO order)
      return (a.insertionOrder || 0) - (b.insertionOrder || 0);
    });
  }

  /**
   * Get just the values in order for simple display
   */
  getValues(): Array<string | number | null> {
    return this.slots.map((slot) => (slot.isEmpty ? null : slot.value));
  }
}
