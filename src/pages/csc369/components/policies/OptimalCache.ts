export interface CacheSlot {
  value: string | number | null;
  isEmpty: boolean;
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity"; // Only present on miss
  nextAccessDistance?: number; // How far in the future the evicted value would be accessed
}

export class OptimalCache {
  private slots: CacheSlot[];
  private capacity: number;
  private accessSequence: Array<string | number>;
  private currentPosition = 0;
  private accessCounter = 0;
  private hitCount = 0;
  private missCount = 0;
  private coldMissCount = 0;
  private capacityMissCount = 0;

  // Track all values that have ever been in the cache
  private everSeen = new Set<string | number>();

  constructor(capacity = 10, accessSequence: Array<string | number> = []) {
    this.capacity = capacity;
    this.accessSequence = [...accessSequence]; // Make a copy
    this.slots = Array(capacity)
      .fill(null)
      .map(() => ({
        value: null,
        isEmpty: true,
      }));
  }

  /**
   * Check if a value is in cache and add it if not present
   * Uses Belady's optimal algorithm for eviction decisions
   *
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and eviction details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;

    // Verify we're accessing the expected value from the sequence
    if (this.currentPosition < this.accessSequence.length) {
      const expectedValue = this.accessSequence[this.currentPosition];
      if (expectedValue !== value) {
        throw new Error(
          `Expected access to ${expectedValue} but got ${value} at position ${this.currentPosition}`
        );
      }
    }

    this.currentPosition++;

    // Check for cache hit
    const hitSlotIndex = this.slots.findIndex((slot) => !slot.isEmpty && slot.value === value);

    if (hitSlotIndex !== -1) {
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

    // Find a slot for the new value
    let targetSlotIndex = -1;
    let evictedValue: string | number | undefined;
    let nextAccessDistance: number | undefined;

    // First, check if there's an empty slot
    const emptySlotIndex = this.slots.findIndex((slot) => slot.isEmpty);

    if (emptySlotIndex !== -1) {
      // Use empty slot
      targetSlotIndex = emptySlotIndex;
    } else {
      // Cache is full, need to evict using Belady's algorithm
      const evictionResult = this.findOptimalVictim();
      targetSlotIndex = evictionResult.slotIndex;
      evictedValue = evictionResult.evictedValue;
      nextAccessDistance = evictionResult.nextAccessDistance;
    }

    // Insert new value at the found slot
    this.slots[targetSlotIndex].value = value;
    this.slots[targetSlotIndex].isEmpty = false;

    return {
      hit: false,
      evictedValue,
      insertedValue: value,
      missType,
      nextAccessDistance,
    };
  }

  /**
   * Find the optimal victim using Belady's algorithm
   * Evict the page that will be accessed furthest in the future (or never)
   */
  private findOptimalVictim(): {
    slotIndex: number;
    evictedValue: string | number;
    nextAccessDistance: number;
  } {
    let optimalSlotIndex = 0;
    let furthestDistance = -1;
    let optimalValue: string | number = this.slots[0].value!;

    // For each occupied slot, find when that value will be accessed next
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.isEmpty) continue;

      const nextAccessDistance = this.findNextAccess(slot.value!, this.currentPosition);

      // If this page will never be accessed again, or will be accessed furthest in the future
      if (nextAccessDistance > furthestDistance) {
        furthestDistance = nextAccessDistance;
        optimalSlotIndex = i;
        optimalValue = slot.value!;
      }
    }

    return {
      slotIndex: optimalSlotIndex,
      evictedValue: optimalValue,
      nextAccessDistance: furthestDistance,
    };
  }

  /**
   * Find the next position where a value will be accessed
   * Returns distance from current position, or Infinity if never accessed again
   */
  private findNextAccess(value: string | number, fromPosition: number): number {
    for (let i = fromPosition; i < this.accessSequence.length; i++) {
      if (this.accessSequence[i] === value) {
        return i - this.currentPosition + 1; // Distance from current position
      }
    }
    return Infinity; // Never accessed again
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
      currentPosition: this.currentPosition,
      sequenceLength: this.accessSequence.length,
      remainingAccesses: Math.max(0, this.accessSequence.length - this.currentPosition),
    };
  }

  /**
   * Get the value that would be evicted next (optimal victim)
   */
  getNextEvictionValue(): string | number | null {
    // Check if cache is full
    if (!this.isFull()) {
      return null; // No eviction needed
    }

    const victim = this.findOptimalVictim();
    return victim.evictedValue;
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
   * Get current position in access sequence
   */
  getCurrentPosition(): number {
    return this.currentPosition;
  }

  /**
   * Get the complete access sequence
   */
  getAccessSequence(): Array<string | number> {
    return [...this.accessSequence];
  }

  /**
   * Get upcoming accesses (next N values)
   */
  getUpcomingAccesses(count = 5): Array<string | number> {
    const start = this.currentPosition;
    const end = Math.min(start + count, this.accessSequence.length);
    return this.accessSequence.slice(start, end);
  }

  /**
   * Reset cache to empty state and restart sequence
   */
  reset(): void {
    this.slots.forEach((slot) => {
      slot.value = null;
      slot.isEmpty = true;
    });
    this.currentPosition = 0;
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.coldMissCount = 0;
    this.capacityMissCount = 0;
    this.everSeen.clear();
  }

  /**
   * Set a new access sequence (useful for testing different sequences)
   */
  setAccessSequence(sequence: Array<string | number>): void {
    this.accessSequence = [...sequence];
    this.reset(); // Reset position and stats
  }

  /**
   * Get cache contents formatted for display
   */
  getDisplayInfo(): Array<{
    index: number;
    value: string;
    isEmpty: boolean;
    nextAccessDistance: number | string; // Distance to next access or "Never"
  }> {
    return this.slots.map((slot, index) => {
      let nextAccessDistance: number | string = "Never";

      if (!slot.isEmpty && slot.value !== null) {
        const distance = this.findNextAccess(slot.value, this.currentPosition);
        nextAccessDistance = distance === Infinity ? "Never" : distance;
      }

      return {
        index,
        value: slot.isEmpty ? "---" : String(slot.value),
        isEmpty: slot.isEmpty,
        nextAccessDistance,
      };
    });
  }

  /**
   * Get just the values in order for simple display
   */
  getValues(): Array<string | number | null> {
    return this.slots.map((slot) => (slot.isEmpty ? null : slot.value));
  }

  /**
   * Get visualization showing current state and future accesses
   */
  getOptimalVisualization(): string {
    const values = this.getValues();
    const displayInfo = this.getDisplayInfo();

    const cacheStr = values
      .map((value, index) => {
        const val = value || "---";
        const distance = displayInfo[index].nextAccessDistance;
        return `[${val}:${distance}]`;
      })
      .join(" ");

    const upcoming = this.getUpcomingAccesses(5);
    const upcomingStr = upcoming.length > 0 ? `Next: ${upcoming.join(", ")}` : "End of sequence";

    return `Cache: ${cacheStr}\n${upcomingStr}`;
  }
}
