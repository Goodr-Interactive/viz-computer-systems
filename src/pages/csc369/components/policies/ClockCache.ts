export interface CacheSlot {
  value: string | number | null;
  referenceBit: boolean;
  isEmpty: boolean;
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity"; // Only present on miss
  clockHandMoved?: boolean;
  secondChancesGiven?: number; // How many second chances were given during eviction
}

export class ClockCache {
  private slots: CacheSlot[];
  private capacity: number;
  private clockHand = 0; // Points to current position in the "clock"
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
        referenceBit: false,
        isEmpty: true,
      }));
  }

  /**
   * Check if a value is in cache and add it if not present
   * Returns whether it was a hit or miss, plus eviction info
   * Sets reference bit on hits (key behavior for Clock algorithm)
   *
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and eviction details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;

    // Check for cache hit
    const hitSlotIndex = this.slots.findIndex((slot) => !slot.isEmpty && slot.value === value);

    if (hitSlotIndex !== -1) {
      // Cache hit! Set reference bit (this gives it a "second chance")
      this.hitCount++;
      this.slots[hitSlotIndex].referenceBit = true;
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

    // Find a slot for the new value using Clock algorithm
    const evictionResult = this.findSlotToEvict();

    // Insert new value at the found slot
    this.slots[evictionResult.slotIndex].value = value;
    this.slots[evictionResult.slotIndex].referenceBit = true; // New items get reference bit set
    this.slots[evictionResult.slotIndex].isEmpty = false;

    // Advance clock hand
    this.clockHand = (evictionResult.slotIndex + 1) % this.capacity;

    return {
      hit: false,
      evictedValue: evictionResult.evictedValue,
      insertedValue: value,
      missType,
      clockHandMoved: true,
      secondChancesGiven: evictionResult.secondChancesGiven,
    };
  }

  /**
   * Find a slot to evict using the Clock algorithm
   * This is the core of the Clock algorithm logic
   */
  private findSlotToEvict(): {
    slotIndex: number;
    evictedValue?: string | number;
    secondChancesGiven: number;
  } {
    let secondChancesGiven = 0;
    let startHand = this.clockHand;

    while (true) {
      const currentSlot = this.slots[this.clockHand];

      // If slot is empty, use it
      if (currentSlot.isEmpty) {
        return {
          slotIndex: this.clockHand,
          secondChancesGiven,
        };
      }

      // If reference bit is 0, evict this item
      if (!currentSlot.referenceBit) {
        const evictedValue = currentSlot.value!;
        return {
          slotIndex: this.clockHand,
          evictedValue,
          secondChancesGiven,
        };
      }

      // Reference bit is 1, give it a second chance
      currentSlot.referenceBit = false;
      secondChancesGiven++;

      // Advance clock hand
      this.clockHand = (this.clockHand + 1) % this.capacity;

      // Safety check to prevent infinite loop (shouldn't happen with proper implementation)
      if (this.clockHand === startHand && secondChancesGiven >= this.capacity) {
        // This means all slots have reference bit 1, just evict current slot
        const evictedValue = this.slots[this.clockHand].value!;
        return {
          slotIndex: this.clockHand,
          evictedValue,
          secondChancesGiven,
        };
      }
    }
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
      currentClockHand: this.clockHand,
    };
  }

  /**
   * Get the value that would be evicted next (where clock hand points or next 0-bit)
   */
  getNextEvictionValue(): string | number | null {
    // Simulate the clock algorithm to find what would be evicted
    let hand = this.clockHand;

    for (let i = 0; i < this.capacity; i++) {
      const slot = this.slots[hand];

      if (slot.isEmpty) {
        return null; // Would use empty slot
      }

      if (!slot.referenceBit) {
        return slot.value; // Would evict this
      }

      hand = (hand + 1) % this.capacity;
    }

    // All have reference bit 1, would evict current clock hand position
    return this.slots[this.clockHand].value;
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
   * Get current clock hand position
   */
  getClockHand(): number {
    return this.clockHand;
  }

  /**
   * Reset cache to empty state
   */
  reset(): void {
    this.slots.forEach((slot) => {
      slot.value = null;
      slot.referenceBit = false;
      slot.isEmpty = true;
    });
    this.clockHand = 0;
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.coldMissCount = 0;
    this.capacityMissCount = 0;
    this.everSeen.clear();
  }

  /**
   * Get cache contents formatted for display
   */
  getDisplayInfo(): Array<{
    index: number;
    value: string;
    referenceBit: boolean;
    isClockHand: boolean;
    isEmpty: boolean;
  }> {
    return this.slots.map((slot, index) => ({
      index,
      value: slot.isEmpty ? "---" : String(slot.value),
      referenceBit: slot.referenceBit,
      isClockHand: index === this.clockHand,
      isEmpty: slot.isEmpty,
    }));
  }

  /**
   * Get just the values in order for simple display
   */
  getValues(): Array<string | number | null> {
    return this.slots.map((slot) => (slot.isEmpty ? null : slot.value));
  }

  /**
   * Get reference bits for visualization
   */
  getReferenceBits(): boolean[] {
    return this.slots.map((slot) => slot.referenceBit);
  }

  /**
   * Visualize the clock with hand position
   */
  getClockVisualization(): string {
    const values = this.getValues();
    const refBits = this.getReferenceBits();

    return values
      .map((value, index) => {
        const val = value || "---";
        const ref = refBits[index] ? "1" : "0";
        const hand = index === this.clockHand ? " 👉" : "";
        return `[${val}:${ref}]${hand}`;
      })
      .join(" ");
  }
}
