export interface CacheSlot {
  value: string | number | null;
  queue: 'A1' | 'Am' | null; // Which queue this slot belongs to
}

export interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: 'cold' | 'capacity'; // Only present on miss
  queueTransfer?: boolean; // True if item moved from A1 to Am
  evictedFromQueue?: 'A1' | 'Am'; // Which queue was evicted from
}

export class Simplified2QCache {
  private capacity: number;
  private a1Threshold: number; // Maximum size for A1 queue
  private a1Queue: (string | number)[]; // FIFO queue
  private amQueue: (string | number)[]; // LRU queue (index 0 = LRU, last = MRU)
  private accessCounter: number = 0;
  private hitCount: number = 0;
  private missCount: number = 0;
  private coldMissCount: number = 0;
  private capacityMissCount: number = 0;
  
  // Track all values that have ever been in the cache
  private everSeen: Set<string | number> = new Set();

  constructor(capacity: number = 10, a1Threshold: number = 3) {
    this.capacity = capacity;
    this.a1Threshold = a1Threshold;
    this.a1Queue = [];
    this.amQueue = [];
  }

  /**
   * Check if a value is in cache and add it if not present
   * Implements the Simplified 2Q algorithm
   * 
   * @param value - The value to look for (number or character)
   * @returns CacheResult with hit/miss info and operation details
   */
  checkCache(value: string | number): CacheResult {
    this.accessCounter++;
    
    // Check if value is in Am queue (LRU)
    const amIndex = this.amQueue.indexOf(value);
    if (amIndex !== -1) {
      // Hit in Am queue - move to MRU position
      this.hitCount++;
      this.amQueue.splice(amIndex, 1); // Remove from current position
      this.amQueue.push(value); // Add to MRU position (end)
      return {
        hit: true,
      };
    }
    
    // Check if value is in A1 queue (FIFO)
    const a1Index = this.a1Queue.indexOf(value);
    if (a1Index !== -1) {
      // Hit in A1 queue - remove from A1 and move to Am MRU position
      this.hitCount++;
      this.a1Queue.splice(a1Index, 1); // Remove from A1
      this.amQueue.push(value);
      return {
        hit: true,
        queueTransfer: true,
      };
    }
    
    // Cache miss - determine if it's cold or capacity miss
    this.missCount++;
    
    const isColdMiss = !this.everSeen.has(value);
    const missType: 'cold' | 'capacity' = isColdMiss ? 'cold' : 'capacity';
    
    if (isColdMiss) {
      this.coldMissCount++;
    } else {
      this.capacityMissCount++;
    }
    
    // Track that we've now seen this value
    this.everSeen.add(value);
    
    // Check if we need to evict
    const totalUsed = this.a1Queue.length + this.amQueue.length;
    let evictedValue: string | number | undefined;
    let evictedFromQueue: 'A1' | 'Am' | undefined;
    
    if (totalUsed >= this.capacity) {
      // Need to evict
      if (this.a1Queue.length > this.a1Threshold) {
        // A1 is above threshold, evict oldest from A1 (FIFO)
        evictedValue = this.a1Queue.shift()!; // Remove first (oldest)
        evictedFromQueue = 'A1';
      } else {
        // Evict LRU from Am
        evictedValue = this.amQueue.shift()!; // Remove first (LRU)
        evictedFromQueue = 'Am';
      }
    }
    
    // Add new value to A1 queue (youngest position - end for FIFO)
    this.a1Queue.push(value);
    
    return {
      hit: false,
      evictedValue,
      insertedValue: value,
      missType,
      evictedFromQueue,
    };
  }

  /**
   * Get current cache state for visualization
   */
  getCacheState(): CacheSlot[] {
    const slots: CacheSlot[] = [];
    
    // Add A1 queue items
    this.a1Queue.forEach(value => {
      slots.push({
        value,
        queue: 'A1',
      });
    });
    
    // Add Am queue items (LRU first)
    this.amQueue.forEach(value => {
      slots.push({
        value,
        queue: 'Am',
      });
    });
    
    // Fill remaining slots with empty slots
    while (slots.length < this.capacity) {
      slots.push({
        value: null,
        queue: null,
      });
    }
    
    return slots;
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
      occupancy: this.a1Queue.length + this.amQueue.length,
      uniqueValuesSeen: this.everSeen.size,
      a1Size: this.a1Queue.length,
      amSize: this.amQueue.length,
      a1Threshold: this.a1Threshold,
    };
  }

  /**
   * Get the value that would be evicted next
   */
  getNextEvictionValue(): string | number | null {
    if (this.a1Queue.length + this.amQueue.length < this.capacity) {
      return null; // No eviction needed
    }
    
    if (this.a1Queue.length > this.a1Threshold) {
      return this.a1Queue[0]; // Oldest in A1 (FIFO)
    } else {
      return this.amQueue[0] || null; // LRU in Am
    }
  }

  /**
   * Check if cache is full
   */
  isFull(): boolean {
    return (this.a1Queue.length + this.amQueue.length) >= this.capacity;
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
    this.a1Queue = [];
    this.amQueue = [];
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
    queue: 'A1' | 'Am' | null;
    position: string; // Position description within queue
    isEmpty: boolean;
  }> {
    const display: Array<{
      index: number;
      value: string;
      queue: 'A1' | 'Am' | null;
      position: string;
      isEmpty: boolean;
    }> = [];
    
    let index = 0;
    
    // Add A1 queue items (FIFO order: oldest to youngest)
    this.a1Queue.forEach((value, i) => {
      display.push({
        index: index++,
        value: String(value),
        queue: 'A1',
        position: i === 0 ? 'oldest' : i === this.a1Queue.length - 1 ? 'youngest' : 'middle',
        isEmpty: false,
      });
    });
    
    // Add Am queue items (LRU order: LRU to MRU)
    this.amQueue.forEach((value, i) => {
      display.push({
        index: index++,
        value: String(value),
        queue: 'Am',
        position: i === 0 ? 'LRU' : i === this.amQueue.length - 1 ? 'MRU' : 'middle',
        isEmpty: false,
      });
    });
    
    // Fill remaining slots
    while (index < this.capacity) {
      display.push({
        index: index++,
        value: '---',
        queue: null,
        position: 'empty',
        isEmpty: true,
      });
    }
    
    return display;
  }

  /**
   * Get A1 queue contents
   */
  getA1Queue(): (string | number)[] {
    return [...this.a1Queue];
  }

  /**
   * Get Am queue contents (LRU to MRU order)
   */
  getAmQueue(): (string | number)[] {
    return [...this.amQueue];
  }

  /**
   * Get visual representation of both queues
   */
  getQueueVisualization(): string {
    const a1Str = this.a1Queue.length > 0 
      ? `A1: [${this.a1Queue.join(', ')}] (FIFO: ${this.a1Queue[0]} oldest)`
      : 'A1: []';
    
    const amStr = this.amQueue.length > 0
      ? `Am: [${this.amQueue.join(', ')}] (LRU: ${this.amQueue[0]}, MRU: ${this.amQueue[this.amQueue.length - 1]})`
      : 'Am: []';
    
    return `${a1Str}\n${amStr}`;
  }
} 