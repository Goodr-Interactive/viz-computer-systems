export interface CacheSlot {
  value: string | number | null;
  lastAccessTime: number;
  isEmpty: boolean;
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity"; // Only present on miss
}

export class LRUCache {
  private slots: CacheSlot[];
  private capacity: number;
  private accessTimeCounter = 0;
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
        lastAccessTime: 0,
        isEmpty: true,
      }));
  }

  /**
   * Check if a value is in cache and add it if not present
   * Returns whether it was a hit or miss, plus eviction info
   * Updates access time on hits (key difference from FIFO)
   *
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and eviction details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;
    this.accessTimeCounter++;

    // Check for cache hit
    const hitSlot = this.slots.find((slot) => !slot.isEmpty && slot.value === value);

    if (hitSlot) {
      // Cache hit! Update access time (this is crucial for LRU)
      this.hitCount++;
      hitSlot.lastAccessTime = this.accessTimeCounter;
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

    // Find an empty slot first
    let targetSlot = this.slots.find((slot) => slot.isEmpty);
    let evictedValue: string | number | undefined;

    if (!targetSlot) {
      // All slots are occupied, need to evict using LRU
      // Find the slot with the smallest lastAccessTime (least recently used)
      targetSlot = this.slots.reduce((leastRecent, current) => {
        return current.lastAccessTime < leastRecent.lastAccessTime ? current : leastRecent;
      });

      // Store the evicted value
      evictedValue = targetSlot.value!;
    }

    // Insert new value with current access time
    targetSlot.value = value;
    targetSlot.lastAccessTime = this.accessTimeCounter;
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
   * Get the value that would be evicted next (least recently used)
   */
  getNextEvictionValue(): string | number | null {
    const occupiedSlots = this.slots.filter((slot) => !slot.isEmpty);
    if (occupiedSlots.length === 0) {
      return null;
    }

    const lruSlot = occupiedSlots.reduce((leastRecent, current) => {
      return current.lastAccessTime < leastRecent.lastAccessTime ? current : leastRecent;
    });

    return lruSlot.value;
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
      slot.lastAccessTime = 0;
      slot.isEmpty = true;
    });
    this.accessTimeCounter = 0;
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.coldMissCount = 0;
    this.capacityMissCount = 0;
    this.everSeen.clear();
  }

  /**
   * Get cache contents formatted for display, sorted from LRU to MRU order
   */
  getDisplayInfo(): Array<{
    index: number;
    value: string;
    lastAccessTime: number | null;
    isLRU: boolean;
    isMRU: boolean;
    isEmpty: boolean;
  }> {
    const nextEviction = this.getNextEvictionValue();

    // Find the most recently used item (highest access time)
    const occupiedSlots = this.slots.filter((slot) => !slot.isEmpty);
    let mostRecentValue: string | number | null = null;
    if (occupiedSlots.length > 1) {
      const mostRecentSlot = occupiedSlots.reduce((mostRecent, current) => {
        return current.lastAccessTime > mostRecent.lastAccessTime ? current : mostRecent;
      });
      mostRecentValue = mostRecentSlot.value;
    }

    // Map slots to display info with original index
    const displayItems = this.slots.map((slot, index) => ({
      index,
      value: slot.isEmpty ? "---" : String(slot.value),
      lastAccessTime: slot.isEmpty ? null : slot.lastAccessTime,
      isLRU: !slot.isEmpty && slot.value === nextEviction,
      isMRU: !slot.isEmpty && slot.value === mostRecentValue,
      isEmpty: slot.isEmpty,
    }));

    // Sort from LRU to MRU: empty slots last, then by access time (oldest first = LRU order)
    return displayItems.sort((a, b) => {
      // Empty slots go to the end
      if (a.isEmpty && !b.isEmpty) return 1;
      if (!a.isEmpty && b.isEmpty) return -1;
      if (a.isEmpty && b.isEmpty) return a.index - b.index; // Keep original order for empty slots

      // Sort occupied slots by access time (oldest first = LRU → MRU order)
      return (a.lastAccessTime || 0) - (b.lastAccessTime || 0);
    });
  }

  /**
   * Get just the values in order for simple display
   */
  getValues(): Array<string | number | null> {
    return this.slots.map((slot) => (slot.isEmpty ? null : slot.value));
  }

  /**
   * Get values sorted by access time (most recent first) - helpful for LRU visualization
   */
  getValuesByRecency(): Array<{
    value: string | number;
    lastAccessTime: number;
    position: number;
  }> {
    return this.slots
      .map((slot, index) => ({ ...slot, position: index }))
      .filter((slot) => !slot.isEmpty)
      .sort((a, b) => b.lastAccessTime - a.lastAccessTime) // Most recent first
      .map((slot) => ({
        value: slot.value!,
        lastAccessTime: slot.lastAccessTime,
        position: slot.position,
      }));
  }
}
