import type { PhysicalMemorySize, PageSize } from "./types";

/**
 * Configuration for a page table level
 */
export interface PageTableLevel {
  /** Number of index bits for this level */
  indexBits: number;
  /** Label for this level (e.g., "PD Index", "PT Index") */
  label: string;
}

/**
 * Represents a Page Table Entry structure
 */
export interface PageTableEntry {
  /** Physical Frame Number */
  pfn: number;
  /** Valid bit - indicates if the page is in memory */
  valid: boolean;
}

/**
 * Represents a complete page table with all its entries
 */
export interface PageTable {
  /** Array of PTEs, indexed by the virtual address index */
  entries: PageTableEntry[];
  /** The PFN of this page table itself */
  tablePfn: number;
}

/**
 * Generated translation values
 */
export interface TranslationValues {
  /** Page Directory Base Register value */
  pdbr: number;
  /** Page tables for each level (with valid bits) */
  pageTables: PageTable[];
  /** Final PFN that contains the actual data */
  finalPfn: number;
  /** Virtual address indices for each level */
  virtualIndices: number[];
  /** The complete virtual address */
  virtualAddress: number;
  /** The resulting physical address */
  physicalAddress: number;
}

/**
 * System for handling virtual address translation with configurable page table levels
 */
export class TranslationSystem {
  private readonly physicalMemorySize: PhysicalMemorySize;
  private readonly pageSize: PageSize;
  private readonly pageTableLevels: PageTableLevel[];
  
  // Calculated values
  private readonly offsetBits: number;
  private readonly pfnBits: number;
  private readonly totalPages: number;
  private readonly maxPfn: number;

  constructor(
    physicalMemorySize: PhysicalMemorySize,
    pageSize: PageSize,
    pageTableLevels: PageTableLevel[]
  ) {
    this.physicalMemorySize = physicalMemorySize;
    this.pageSize = pageSize;
    this.pageTableLevels = pageTableLevels;
    
    // Calculate derived values
    this.offsetBits = Math.log2(pageSize);
    this.totalPages = physicalMemorySize / pageSize;
    this.pfnBits = Math.log2(this.totalPages);
    this.maxPfn = this.totalPages - 1;
    
    // Validate configuration
    this.validateConfiguration();
  }

  /**
   * Validates that the configuration is reasonable
   */
  private validateConfiguration(): void {
    if (!Number.isInteger(this.offsetBits)) {
      throw new Error("Page size must be a power of 2");
    }
    
    if (!Number.isInteger(this.pfnBits)) {
      throw new Error("Physical memory size must result in a power-of-2 number of pages");
    }
    
    if (this.pageTableLevels.length === 0) {
      throw new Error("At least one page table level must be specified");
    }
    
    // Check that each level has reasonable index bits
    for (const level of this.pageTableLevels) {
      if (level.indexBits < 2 || level.indexBits > 20) {
        throw new Error(`Page table level index bits must be between 2 and 20, got ${level.indexBits}`);
      }
    }
  }

  /**
   * Generates a random value in the "reasonable" range (not at extremes)
   */
  private generateReasonableValue(min: number, max: number): number {
    if (max - min < 6) {
      // If range is too small, just use the middle
      return Math.floor((min + max) / 2);
    }
    
    // Use range from min+3 to max-3 to avoid extremes
    const safeMin = min + 3;
    const safeMax = max - 3;
    return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
  }

  /**
   * Generates reasonable translation values
   */
  public generateTranslation(): TranslationValues {
    // Generate PDBR (reasonable PFN value) - will be updated later
    // let pdbr = this.generateReasonableValue(0, this.maxPfn);
    
    // Generate virtual address indices
    const virtualIndices: number[] = [];
    for (const level of this.pageTableLevels) {
      const maxIndex = Math.pow(2, level.indexBits) - 1;
      virtualIndices.push(this.generateReasonableValue(0, maxIndex));
    }
    
    // Generate page offset
    const maxOffset = this.pageSize - 1;
    const pageOffset = this.generateReasonableValue(0, maxOffset);
    
    // Generate final PFN
    const finalPfn = this.generateReasonableValue(0, this.maxPfn);
    
    // Generate page tables for each level
    const pageTables: PageTable[] = [];
    for (let levelIndex = 0; levelIndex < this.pageTableLevels.length; levelIndex++) {
      const level = this.pageTableLevels[levelIndex];
      const numEntries = Math.pow(2, level.indexBits);
      const entries: PageTableEntry[] = [];
      
      // Generate the PFN for this page table itself
      const tablePfn = this.generateReasonableValue(0, this.maxPfn);
      
      for (let entryIndex = 0; entryIndex < numEntries; entryIndex++) {
        const isValidPath = entryIndex === virtualIndices[levelIndex];
        
        let pfn: number;
        if (isValidPath) {
          // This is the path our translation follows
          if (levelIndex === this.pageTableLevels.length - 1) {
            // Last level points to the final data page
            pfn = finalPfn;
          } else {
            // Points to the next level page table
            pfn = pageTables.length < this.pageTableLevels.length - 1 
              ? this.generateReasonableValue(0, this.maxPfn) 
              : this.generateReasonableValue(0, this.maxPfn);
          }
        } else {
          // Random PFN for non-path entries
          pfn = this.generateReasonableValue(0, this.maxPfn);
        }
        
        entries.push({
          pfn,
          valid: isValidPath ? true : Math.random() < 0.7 // 70% chance of being valid for non-path entries
        });
      }
      
      pageTables.push({
        entries,
        tablePfn
      });
    }
    
    // Ensure PDBR points to the first page table's PFN
    const pdbr = pageTables.length > 0 ? pageTables[0].tablePfn : this.generateReasonableValue(0, this.maxPfn);

    // Update page table PFNs to point to each other correctly
    for (let i = 0; i < pageTables.length - 1; i++) {
      const currentLevelIndex = virtualIndices[i];
      pageTables[i].entries[currentLevelIndex].pfn = pageTables[i + 1].tablePfn;
    }
    
    // Now update non-path entries with simple random PFNs or mark invalid
    for (let levelIndex = 0; levelIndex < pageTables.length; levelIndex++) {
      for (let entryIndex = 0; entryIndex < pageTables[levelIndex].entries.length; entryIndex++) {
        const isValidPath = entryIndex === virtualIndices[levelIndex];
        if (!isValidPath) {
          // For filler entries, just use any reasonable PFN - collisions are fine
          // If we want some variety, occasionally make them invalid
          if (Math.random() < 0.2) { // 20% chance to be invalid
            pageTables[levelIndex].entries[entryIndex].valid = false;
            pageTables[levelIndex].entries[entryIndex].pfn = this.generateReasonableValue(0, this.maxPfn);
          } else {
            // 80% chance to be valid with any reasonable PFN (collisions allowed)
            pageTables[levelIndex].entries[entryIndex].pfn = this.generateReasonableValue(0, this.maxPfn);
          }
        }
      }
    }
    
    // Construct virtual address
    let virtualAddress = pageOffset;
    for (let i = this.pageTableLevels.length - 1; i >= 0; i--) {
      virtualAddress |= (virtualIndices[i] << (this.offsetBits + this.getTotalIndexBitsAfter(i)));
    }
    
    // Construct physical address
    const physicalAddress = (finalPfn << this.offsetBits) | pageOffset;
    
    return {
      pdbr,
      pageTables,
      finalPfn,
      virtualIndices,
      virtualAddress,
      physicalAddress
    };
  }

  /**
   * Gets the total number of index bits after a given level
   */
  private getTotalIndexBitsAfter(levelIndex: number): number {
    let totalBits = 0;
    for (let i = levelIndex + 1; i < this.pageTableLevels.length; i++) {
      totalBits += this.pageTableLevels[i].indexBits;
    }
    return totalBits;
  }

  /**
   * Converts a number to binary string with optional padding
   */
  public static toBinary(value: number, minBits?: number): string {
    let binary = value.toString(2);
    if (minBits && binary.length < minBits) {
      binary = '0'.repeat(minBits - binary.length) + binary;
    }
    return binary;
  }

  /**
   * Converts a number to hexadecimal string with optional padding
   */
  public static toHex(value: number, minDigits?: number): string {
    let hex = value.toString(16).toUpperCase();
    if (minDigits && hex.length < minDigits) {
      hex = '0'.repeat(minDigits - hex.length) + hex;
    }
    return '0x' + hex;
  }

  /**
   * Pads a binary string to the nearest byte boundary (multiple of 8 bits)
   */
  public static padToNearestByte(binary: string): string {
    const remainder = binary.length % 8;
    if (remainder !== 0) {
      const padding = 8 - remainder;
      return '0'.repeat(padding) + binary;
    }
    return binary;
  }

  /**
   * Extracts bits from a binary string
   */
  public static extractBits(binary: string, startBit: number, numBits: number): string {
    // Convert to 0-based indexing from the right
    const totalBits = binary.length;
    const startIndex = totalBits - startBit - numBits;
    return binary.substring(startIndex, startIndex + numBits);
  }

  /**
   * Gets the virtual address breakdown for display
   */
  public getVirtualAddressBreakdown(translation: TranslationValues): {
    indices: { bits: string; value: number; label: string }[];
    offset: { bits: string; value: number };
  } {
    const virtualBinary = TranslationSystem.toBinary(translation.virtualAddress);
    const paddedBinary = TranslationSystem.padToNearestByte(virtualBinary);
    
    const indices: { bits: string; value: number; label: string }[] = [];
    let currentBit = this.offsetBits;
    
    // Process levels from right to left (reverse order)
    for (let i = this.pageTableLevels.length - 1; i >= 0; i--) {
      const level = this.pageTableLevels[i];
      const bits = TranslationSystem.extractBits(paddedBinary, currentBit, level.indexBits);
      indices.unshift({
        bits,
        value: translation.virtualIndices[i],
        label: level.label
      });
      currentBit += level.indexBits;
    }
    
    const offsetBits = TranslationSystem.extractBits(paddedBinary, 0, this.offsetBits);
    const offsetValue = translation.virtualAddress & ((1 << this.offsetBits) - 1);
    
    return {
      indices,
      offset: { bits: offsetBits, value: offsetValue }
    };
  }

  /**
   * Gets system information
   */
  public getSystemInfo() {
    return {
      physicalMemorySize: this.physicalMemorySize,
      pageSize: this.pageSize,
      offsetBits: this.offsetBits,
      pfnBits: this.pfnBits,
      totalPages: this.totalPages,
      maxPfn: this.maxPfn,
      pageTableLevels: this.pageTableLevels
    };
  }

  /**
   * Gets a subset of page table entries for display (7 entries including the correct index)
   */
  public getDisplayEntries(pageTable: PageTable, correctIndex: number, maxEntries: number = 7): {
    entries: { entry: PageTableEntry; index: number; isCorrect: boolean }[];
    startIndex: number;
    endIndex: number;
  } {
    const totalEntries = pageTable.entries.length;
    const entriesToShow = Math.min(maxEntries, totalEntries);
    
    // If we can show all entries, just show them all
    if (entriesToShow >= totalEntries) {
      const displayEntries = [];
      for (let i = 0; i < totalEntries; i++) {
        displayEntries.push({
          entry: pageTable.entries[i],
          index: i,
          isCorrect: i === correctIndex
        });
      }
      return {
        entries: displayEntries,
        startIndex: 0,
        endIndex: totalEntries - 1
      };
    }
    
    // Calculate the range where we can start while still including the correct index
    const minStartIndex = Math.max(0, correctIndex - entriesToShow + 1);
    const maxStartIndex = Math.min(correctIndex, totalEntries - entriesToShow);
    
    // Randomly choose a start index within the valid range
    const startIndex = minStartIndex + Math.floor(Math.random() * (maxStartIndex - minStartIndex + 1));
    const endIndex = startIndex + entriesToShow - 1;
    
    const displayEntries = [];
    for (let i = startIndex; i <= endIndex; i++) {
      displayEntries.push({
        entry: pageTable.entries[i],
        index: i,
        isCorrect: i === correctIndex
      });
    }
    
    return {
      entries: displayEntries,
      startIndex,
      endIndex
    };
  }
} 