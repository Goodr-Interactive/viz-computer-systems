import type { PhysicalMemorySize, PageSize } from "./types";

/**
 * Represents a Page Table Entry structure
 */
export interface PageTableEntry {
  /** Physical Frame Number */
  pfn: number;
  /** Valid bit - indicates if the page is in memory */
  valid: boolean;
  rwx: number | null;
}

export interface PageTable {
  /** Array of PTEs, indexed by the virtual address index */
  entries: PageTableEntry[];
  /** The PFN of this page table itself */
  tablePfn: number;
  startIndex: number;
  numEntries: number;
}

export interface PageTableLevel {
  indexBits: number;
  label: string;
}

export interface TranslationValues {
  /** Page Directory Base Register value */
  pdbr: number;
  /** Final PFN that contains the actual data */
  finalPfn: number;
  /** Virtual address indices for each level */
  virtualIndices: number[];
  /** The complete virtual address */
  virtualAddress: number;
  /** The resulting physical address */
  physicalAddress: number;
  /** Array of page tables for each level */
  pageTables: PageTable[];
  offset: number;
}

interface PageTableGenerationResult {
  pageTable: PageTable;
  replacedIndex: number | null;
}

export interface SystemInfo {
  physicalMemorySize: PhysicalMemorySize;
  pageSize: PageSize;
  totalPages: number;
  offsetBits: number;
  pfnBits: number;
  pageTableLevels: number;
}

export interface VirtualAddressBreakdown {
  indices: Array<{
    bits: string;
    value: number;
    label: string;
    startBit: number;
  }>;
  offset: {
    bits: string;
    value: number;
    startBit: number;
  };
}

export class TranslationSystem {
  private readonly physicalMemorySize: PhysicalMemorySize;
  private readonly pageSize: PageSize;
  private readonly pageTableLevels: number = 2;

  private readonly offsetBits: number;
  private readonly pfnBits: number;
  private readonly totalPages: number;
  private readonly maxPfn: number;
  private readonly pageTableBits: number;

  private readonly numEntries: number;

  private coreMap: Map<number, PageTable>;
  private translationValues: TranslationValues;

  constructor(physicalMemorySize: PhysicalMemorySize, pageSize: PageSize) {
    this.physicalMemorySize = physicalMemorySize;
    this.pageSize = pageSize;

    this.offsetBits = Math.log2(pageSize);
    this.totalPages = physicalMemorySize / pageSize;
    this.pfnBits = Math.log2(this.totalPages);
    this.maxPfn = this.totalPages - 1;
    this.pageTableBits = Math.log2(this.pageSize / 4);

    this.numEntries = this.pageSize / 4;

    this.coreMap = new Map<number, PageTable>();
    this.translationValues = this.generateTranslation();
  }

  public getTranslationValues(): TranslationValues {
    return this.translationValues;
  }

  private generateTranslation(): TranslationValues {
    // Reserve PFNs for all page table levels to avoid collisions
    const reservedPfns: number[] = [];

    // Reserve pageTableLevels number of PFNs
    while (reservedPfns.length < this.pageTableLevels + 1) {
      const candidatePfn = Math.floor(Math.random() * (this.maxPfn + 1));
      if (!this.coreMap.has(candidatePfn)) {
        reservedPfns.push(candidatePfn);

        this.coreMap.set(candidatePfn, {
          entries: [],
          tablePfn: candidatePfn,
          startIndex: -1,
          numEntries: 0,
        });
      }
    }

    reservedPfns.sort((a, b) => a - b);
    const pdbr = reservedPfns[0];
    const validIndices: number[] = [];
    const pageTables: PageTable[] = [];

    for (let i = 0; i < reservedPfns.length - 1; i++) {
      const nextPfn = reservedPfns[i + 1];
      const isLastLevel = i === reservedPfns.length - 2;
      const generateResult = this.generatePageTable(reservedPfns[i], isLastLevel, 7, nextPfn);
      if (generateResult.replacedIndex !== null) {
        validIndices.push(generateResult.replacedIndex);
      }
      pageTables.push(generateResult.pageTable);
    }

    const offset = Math.floor(Math.random() * this.pageSize);
    const finalPfn = reservedPfns[reservedPfns.length - 1];

    // Generate virtual address from the indices
    let virtualAddress = 0;
    let bitPosition = this.offsetBits;
    for (let i = validIndices.length - 1; i >= 0; i--) {
      const actualPageTableIndex = pageTables[i].startIndex + validIndices[i];
      virtualAddress |= actualPageTableIndex << bitPosition;
      bitPosition += this.pageTableBits;
    }
    virtualAddress |= offset;

    // Calculate physical address
    const physicalAddress = (finalPfn << this.offsetBits) | offset;

    return {
      pdbr,
      finalPfn,
      virtualIndices: validIndices,
      virtualAddress,
      physicalAddress,
      pageTables,
      offset,
    };
  }

  private generatePageTable(
    pfn: number,
    lastLevel: boolean = false,
    numEntries: number = 7,
    nextLevelPfn?: number
  ): PageTableGenerationResult {
    // Check that we can generate more entries at the start of the method
    if (numEntries > this.numEntries) {
      throw new Error(
        `Cannot generate ${numEntries} entries - page table can only hold ${this.numEntries} entries`
      );
    }

    // Assume coreMap already has a page table at this pfn
    const existingPageTable = this.coreMap.get(pfn);
    if (!existingPageTable) {
      throw new Error(`Expected page table at PFN ${pfn} but none found in coreMap`);
    }

    // Check if we have enough space for the new entries
    const totalEntriesNeeded = existingPageTable.numEntries + numEntries;
    if (totalEntriesNeeded > this.numEntries) {
      throw new Error(
        `Cannot add ${numEntries} entries - would exceed page table capacity of ${this.numEntries} entries`
      );
    }

    // Handle startIndex logic
    let startIndex = existingPageTable.startIndex;

    if (startIndex === -1) {
      // Generate a new random startIndex that can fit all entries
      const maxStartIndex = this.numEntries - totalEntriesNeeded;
      if (maxStartIndex < 0) {
        throw new Error(
          `Cannot fit ${totalEntriesNeeded} total entries in page table of size ${this.numEntries}`
        );
      }
      startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
    } else {
      // Check if current startIndex + total entries will go out of bounds
      if (startIndex + totalEntriesNeeded > this.numEntries) {
        // Set to the largest index that can fit all entries
        startIndex = this.numEntries - totalEntriesNeeded;
        if (startIndex < 0) {
          throw new Error(
            `Cannot fit ${totalEntriesNeeded} total entries in page table of size ${this.numEntries}`
          );
        }
      }
    }

    const newEntries: PageTableEntry[] = [];
    for (let i = 0; i < numEntries; i++) {
      const entryPfn = Math.floor(Math.random() * (this.maxPfn + 1));
      let valid = true;
      if (this.coreMap.has(entryPfn) || Math.random() < 0.3) {
        valid = false;
      }
      this.coreMap.set(entryPfn, {
        entries: [],
        tablePfn: entryPfn,
        startIndex: -1,
        numEntries: 0,
      });
      newEntries.push({
        pfn: entryPfn,
        valid: valid,
        rwx: lastLevel ? Math.floor(Math.random() * 8) : null,
      });
    }

    // Replace one entry with the nextLevelPfn if provided
    let replacedIndex: number | null = null;
    if (nextLevelPfn !== undefined) {
      replacedIndex = Math.floor(Math.random() * numEntries);
      const rwx = lastLevel ? Math.floor(Math.random() * 4) + 4 : null; // 4-7 for last level
      newEntries[replacedIndex] = {
        pfn: nextLevelPfn,
        valid: true, // Ensure this entry is valid
        rwx: rwx,
      };
    }

    // Combine existing entries with newly generated entries
    const combinedEntries = [...existingPageTable.entries, ...newEntries];

    // Update the existing page table with the combined entries
    const updatedPageTable: PageTable = {
      entries: combinedEntries,
      tablePfn: pfn,
      startIndex: startIndex,
      numEntries: totalEntriesNeeded,
    };

    // Update the coreMap with the populated page table
    this.coreMap.set(pfn, updatedPageTable);

    return {
      pageTable: updatedPageTable,
      replacedIndex: replacedIndex,
    };
  }

  public getSystemInfo(): SystemInfo {
    return {
      physicalMemorySize: this.physicalMemorySize,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      offsetBits: this.offsetBits,
      pfnBits: this.pfnBits,
      pageTableLevels: this.pageTableLevels,
    };
  }

  public static toHex(num: number, padLength?: number): string {
    const hex = num.toString(16).toUpperCase();
    const padding = padLength ? Math.max(0, padLength - hex.length) : 0;
    return "0x" + "0".repeat(padding) + hex;
  }

  public static toBinary(num: number, padLength: number): string {
    const binary = num.toString(2);
    const padding = Math.max(0, padLength - binary.length);
    return "0".repeat(padding) + binary;
  }

  public getDisplayEntries(pageTable: PageTable, correctIndex: number) {
    return {
      entries: pageTable.entries.map((entry, arrayIndex) => ({
        entry,
        index: pageTable.startIndex + arrayIndex, // Actual index in the page table
        isCorrect: arrayIndex === correctIndex,
      })),
      startIndex: pageTable.startIndex,
      endIndex: pageTable.startIndex + pageTable.numEntries - 1,
    };
  }

  public getVirtualAddressBreakdown(translation: TranslationValues): VirtualAddressBreakdown {
    const indices = [];
    let remainingAddress = translation.virtualAddress;

    // Extract offset bits
    const offsetMask = (1 << this.offsetBits) - 1;
    const offsetValue = remainingAddress & offsetMask;
    remainingAddress >>= this.offsetBits;

    // Extract index bits for each level (in reverse order)
    const indexMask = (1 << this.pageTableBits) - 1;
    for (let i = 0; i < this.pageTableLevels; i++) {
      const indexValue = remainingAddress & indexMask;
      remainingAddress >>= this.pageTableBits;

      // Convert bits to string format for UI
      let bitsString = "";
      for (let bit = this.pageTableBits - 1; bit >= 0; bit--) {
        bitsString += ((indexValue >> bit) & 1).toString();
      }

      indices.unshift({
        bits: bitsString,
        value: indexValue,
        label: i === this.pageTableLevels - 1 ? "PT Index" : "PD Index",
        startBit: this.offsetBits + i * this.pageTableBits,
      });
    }

    // Create offset bits string
    let offsetBitsString = "";
    for (let bit = this.offsetBits - 1; bit >= 0; bit--) {
      offsetBitsString += ((offsetValue >> bit) & 1).toString();
    }

    return {
      indices,
      offset: {
        bits: offsetBitsString,
        value: offsetValue,
        startBit: 0,
      },
    };
  }
}
