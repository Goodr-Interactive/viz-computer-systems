export interface CacheSlot {
  value: string | number | null;
  isEmpty: boolean;
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity"; // Only present on miss
  randomSlotSelected?: number; // Which slot was randomly selected for eviction
}

export class RandomCache {
  private slots: CacheSlot[];
  private capacity: number;
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
        isEmpty: true,
      }));
  }

  /**
   * Check if a value is in cache and add it if not present
   * Uses random selection for eviction decisions
   *
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and eviction details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;

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
    let randomSlotSelected: number | undefined;

    // First, check if there's an empty slot
    const emptySlotIndex = this.slots.findIndex((slot) => slot.isEmpty);

    if (emptySlotIndex !== -1) {
      // Use empty slot
      targetSlotIndex = emptySlotIndex;
    } else {
      // Cache is full, need to evict using random selection
      const evictionResult = this.findRandomVictim();
      targetSlotIndex = evictionResult.slotIndex;
      evictedValue = evictionResult.evictedValue;
      randomSlotSelected = evictionResult.slotIndex;
    }

    // Insert new value at the found slot
    this.slots[targetSlotIndex].value = value;
    this.slots[targetSlotIndex].isEmpty = false;

    return {
      hit: false,
      evictedValue,
      insertedValue: value,
      missType,
      randomSlotSelected,
    };
  }

  /**
   * Find a random victim for eviction
   * Randomly selects from all occupied slots
   */
  private findRandomVictim(): {
    slotIndex: number;
    evictedValue: string | number;
  } {
    // Get all occupied slot indices
    const occupiedIndices: number[] = [];
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].isEmpty) {
        occupiedIndices.push(i);
      }
    }

    // Randomly select one of the occupied slots
    const randomIndex = Math.floor(Math.random() * occupiedIndices.length);
    const selectedSlotIndex = occupiedIndices[randomIndex];
    const evictedValue = this.slots[selectedSlotIndex].value!;

    return {
      slotIndex: selectedSlotIndex,
      evictedValue,
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
   * Get a random value that could be evicted next
   * Note: This is just for preview - actual random selection happens during eviction
   */
  getNextEvictionValue(): string | number | null {
    if (!this.isFull()) {
      return null; // No eviction needed
    }

    // Return a random current value (just for preview purposes)
    const occupiedSlots = this.slots.filter((slot) => !slot.isEmpty);
    if (occupiedSlots.length === 0) return null;

    const randomSlot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
    return randomSlot.value;
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
      slot.isEmpty = true;
    });
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
    isEmpty: boolean;
    canBeEvicted: boolean; // Whether this slot could be randomly selected
  }> {
    return this.slots.map((slot, index) => ({
      index,
      value: slot.isEmpty ? "---" : String(slot.value),
      isEmpty: slot.isEmpty,
      canBeEvicted: !slot.isEmpty, // Any occupied slot can be randomly evicted
    }));
  }

  /**
   * Get just the values in order for simple display
   */
  getValues(): Array<string | number | null> {
    return this.slots.map((slot) => (slot.isEmpty ? null : slot.value));
  }

  /**
   * Get random cache visualization
   */
  getRandomVisualization(): string {
    const values = this.getValues();
    const displayInfo = this.getDisplayInfo();

    return values
      .map((value, index) => {
        const val = value || "---";
        const canEvict = displayInfo[index].canBeEvicted ? "🎲" : "";
        return `[${val}]${canEvict}`;
      })
      .join(" ");
  }

  /**
   * Simulate what would happen with the next eviction (for educational purposes)
   * Returns all possible eviction candidates with equal probability
   */
  getEvictionCandidates(): Array<{
    slotIndex: number;
    value: string | number;
    probability: number;
  }> {
    const occupiedSlots = this.slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => !slot.isEmpty);

    if (occupiedSlots.length === 0) return [];

    const probability = 1 / occupiedSlots.length;

    return occupiedSlots.map(({ slot, index }) => ({
      slotIndex: index,
      value: slot.value!,
      probability,
    }));
  }
}
