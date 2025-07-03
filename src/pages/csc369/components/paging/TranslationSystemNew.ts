import type { PhysicalMemorySize, PageSize } from "./types";

/**
 * Represents a Page Table Entry (PTE) or Page Directory Entry (PDE) structure
 *
 * In multi-level page tables:
 * - PDEs (Page Directory Entries) point to other page tables (rwx is null)
 * - PTEs (Page Table Entries) point to actual data pages (rwx has permission bits)
 */
export interface PageTableEntry {
  /** Physical Frame Number - points to either a page table or data page */
  pfn: number;
  /** Valid bit - indicates if the page is currently in physical memory */
  valid: boolean;
  /**
   * Permission bits (Read/Write/Execute)
   * - null for PDEs (Page Directory Entries)
   * - 0-7 for PTEs (Page Table Entries), where bits represent RWX permissions
   */
  rwx: number | null;
}

/**
 * Represents a complete page table containing multiple entries
 *
 * Page tables can be partially filled and don't always start at index 0.
 * This allows for more realistic simulation of sparse address spaces.
 */
export interface PageTable {
  /** Array of page table entries (PTEs or PDEs) */
  entries: PageTableEntry[];
  /** The Physical Frame Number where this page table itself is stored */
  tablePfn: number;
  /** Starting index within the page table where entries begin */
  startIndex: number;
  /** Total number of valid entries in this page table */
  numEntries: number;
}

/**
 * Configuration for a single level in the page table hierarchy
 * Used for defining multi-level page table structures
 */
export interface PageTableLevel {
  /** Number of bits used to index into this level */
  indexBits: number;
  /** Human-readable label for this level (e.g., "Page Directory", "Page Table") */
  label: string;
}

/**
 * Complete translation information for a virtual-to-physical address mapping
 *
 * This represents the result of a successful address translation,
 * including all intermediate page tables and the final physical address.
 */
export interface TranslationValues {
  /** Page Directory Base Register - PFN of the root page table */
  pdbr: number;
  /** Physical Frame Number of the final data page */
  finalPfn: number;
  /** Index values used at each page table level during translation */
  virtualIndices: number[];
  /** The original virtual address being translated */
  virtualAddress: number;
  /** The resulting physical address after translation */
  physicalAddress: number;
  /** Complete hierarchy of page tables used in this translation */
  pageTables: PageTable[];
  /** Byte offset within the final page */
  offset: number;
}

/**
 * Result of generating a page table, including information about
 * which entry was replaced with the correct next-level pointer
 */
interface PageTableGenerationResult {
  /** The generated page table with all entries populated */
  pageTable: PageTable;
  /** Index of the entry that was replaced with the correct pointer (null if none) */
  replacedIndex: number | null;
}

/**
 * System configuration information for the memory management system
 * Contains all the calculated parameters needed for address translation
 */
export interface SystemInfo {
  /** Total size of physical memory */
  physicalMemorySize: PhysicalMemorySize;
  /** Size of each page in bytes */
  pageSize: PageSize;
  /** Total number of pages in the system */
  totalPages: number;
  /** Number of bits needed for the page offset */
  offsetBits: number;
  /** Number of bits needed for the Physical Frame Number */
  pfnBits: number;
  /** Number of levels in the page table hierarchy */
  pageTableLevels: number;
}

/**
 * Detailed breakdown of a virtual address showing how it's divided
 * into page table indices and offset for visualization purposes
 */
export interface VirtualAddressBreakdown {
  /** Array of index components, one for each page table level */
  indices: Array<{
    /** Binary representation of this index */
    bits: string;
    /** Decimal value of this index */
    value: number;
    /** Label describing this level (e.g., "PD Index", "PT Index") */
    label: string;
    /** Starting bit position in the virtual address */
    startBit: number;
  }>;
  /** Page offset component */
  offset: {
    /** Binary representation of the offset */
    bits: string;
    /** Decimal value of the offset */
    value: number;
    /** Starting bit position (always 0 for offset) */
    startBit: number;
  };
}

/**
 * TranslationSystem - Core engine for multi-level page table simulation
 *
 * This class simulates a complete memory management system with hierarchical
 * page tables. It can generate realistic translation scenarios for educational
 * purposes, including:
 *
 * - Multi-level page table hierarchies
 * - Sparse page tables with configurable invalid entries
 * - Dynamic page table generation for exploration
 * - Virtual address breakdown and physical address calculation
 *
 * The system maintains a "core map" that tracks all allocated page tables
 * and ensures no PFN collisions occur during simulation.
 */
export class TranslationSystem {
  // === System Configuration (Immutable) ===
  /** Total physical memory size in bytes */
  private readonly physicalMemorySize: PhysicalMemorySize;
  /** Size of each page in bytes */
  private readonly pageSize: PageSize;
  /** Number of levels in the page table hierarchy */
  private readonly pageTableLevels: number;
  /** Probability that any generated entry will be invalid (0.0 = all valid, 1.0 = all invalid) */
  private readonly invalidEntryProbability: number;

  // === Calculated System Parameters (Immutable) ===
  /** Number of bits needed for byte offset within a page */
  private readonly offsetBits: number;
  /** Number of bits needed to represent a Physical Frame Number */
  private readonly pfnBits: number;
  /** Total number of pages that fit in physical memory */
  private readonly totalPages: number;
  /** Maximum valid PFN value (totalPages - 1) */
  private readonly maxPfn: number;
  /** Number of bits needed to index within a single page table */
  private readonly pageTableBits: number;
  /** Number of entries that can fit in one page table (pageSize / 4 bytes per entry) */
  private readonly numEntries: number;

  // === Dynamic System State ===
  /**
   * Core map tracking all allocated Physical Frame Numbers
   * Key: PFN, Value: PageTable structure (may be empty placeholder)
   * Prevents PFN collisions and tracks page table allocation
   */
  private coreMap: Map<number, PageTable>;
  /** Pre-generated correct translation path for the current scenario */
  private translationValues: TranslationValues;

  /**
   * Creates a new translation system with the specified configuration
   *
   * @param physicalMemorySize - Total size of physical memory
   * @param pageSize - Size of each page in bytes
   * @param pageTableLevels - Number of levels in the page table hierarchy (default: 2)
   * @param invalidEntryProbability - Chance that generated entries are invalid (default: 0.3)
   */
  constructor(
    physicalMemorySize: PhysicalMemorySize,
    pageSize: PageSize,
    pageTableLevels = 2,
    invalidEntryProbability = 0.3
  ) {
    // Store configuration parameters
    this.physicalMemorySize = physicalMemorySize;
    this.pageSize = pageSize;
    this.pageTableLevels = pageTableLevels;
    this.invalidEntryProbability = invalidEntryProbability;

    // Calculate derived system parameters
    this.offsetBits = Math.log2(pageSize);
    this.totalPages = physicalMemorySize / pageSize;
    this.pfnBits = Math.log2(this.totalPages);
    this.maxPfn = this.totalPages - 1;
    this.pageTableBits = Math.log2(this.pageSize / 4); // 4 bytes per entry
    this.numEntries = this.pageSize / 4;

    // Initialize dynamic state
    this.coreMap = new Map<number, PageTable>();

    // Generate the initial translation scenario
    this.translationValues = this.generateTranslation();
  }

  /**
   * Returns the current translation values (virtual address, page tables, physical address)
   * This represents the "correct solution" for the current scenario
   */
  public getTranslationValues(): TranslationValues {
    return this.translationValues;
  }

  /**
   * Generates a complete, valid address translation scenario
   *
   * This method creates:
   * 1. A hierarchy of page tables with reserved PFNs
   * 2. A valid path through the hierarchy
   * 3. Random virtual and physical addresses
   * 4. Populated page tables with realistic invalid entries
   */
  private generateTranslation(): TranslationValues {
    // Step 1: Reserve PFNs for the complete page table hierarchy
    // We need (pageTableLevels + 1) PFNs: one for each level + one for final data page
    const reservedPfns: number[] = [];

    while (reservedPfns.length < this.pageTableLevels + 1) {
      const candidatePfn = Math.floor(Math.random() * (this.maxPfn + 1));

      // Ensure no PFN collisions by checking against existing allocations
      if (!this.coreMap.has(candidatePfn)) {
        reservedPfns.push(candidatePfn);

        // Create placeholder entry in core map to reserve this PFN
        this.coreMap.set(candidatePfn, {
          entries: [],
          tablePfn: candidatePfn,
          startIndex: -1,
          numEntries: 0,
        });
      }
    }

    // Step 2: Organize PFNs and build the page table hierarchy
    reservedPfns.sort((a, b) => a - b);
    const pdbr = reservedPfns[0]; // Root page table (Page Directory Base Register)
    const validIndices: number[] = []; // Correct indices for translation path
    const pageTables: PageTable[] = [];

    // Generate each level of the page table hierarchy
    for (let i = 0; i < reservedPfns.length - 1; i++) {
      const nextPfn = reservedPfns[i + 1]; // Next level or final data page
      const isLastLevel = i === reservedPfns.length - 2; // Is this the last page table level?

      // Generate page table with correct pointer to next level
      const generateResult = this.generatePageTable(reservedPfns[i], isLastLevel, 7, nextPfn);

      // Record which index leads to the correct path
      if (generateResult.replacedIndex !== null) {
        validIndices.push(generateResult.replacedIndex);
      }
      pageTables.push(generateResult.pageTable);
    }

    // Step 3: Generate random offset and final PFN
    const offset = Math.floor(Math.random() * this.pageSize);
    const finalPfn = reservedPfns[reservedPfns.length - 1];

    // Step 4: Construct virtual address from the translation path
    // Build virtual address by combining indices and offset
    let virtualAddress = 0;
    let bitPosition = this.offsetBits;

    // Add each level's index to the virtual address (reverse order)
    for (let i = validIndices.length - 1; i >= 0; i--) {
      const actualPageTableIndex = pageTables[i].startIndex + validIndices[i];
      virtualAddress |= actualPageTableIndex << bitPosition;
      bitPosition += this.pageTableBits;
    }
    virtualAddress |= offset; // Add the page offset

    // Step 5: Calculate the corresponding physical address
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

  /**
   * Generates a single page table with random entries and one correct pointer
   *
   * This method creates realistic page tables for educational scenarios:
   * - Most entries are random/invalid (simulating sparse address spaces)
   * - One entry points to the next level (the "correct" path)
   * - PTEs have permission bits, PDEs do not
   *
   * @param pfn - Physical Frame Number where this page table is stored
   * @param lastLevel - Whether this is the last level (contains PTEs vs PDEs)
   * @param numEntries - Number of entries to generate (default: 7)
   * @param nextLevelPfn - PFN to place in one entry as the correct path
   * @returns Generated page table and the index of the correct entry
   */
  private generatePageTable(
    pfn: number,
    lastLevel = false,
    numEntries = 7,
    nextLevelPfn?: number
  ): PageTableGenerationResult {
    // Validate input parameters
    if (numEntries > this.numEntries) {
      throw new Error(
        `Cannot generate ${numEntries} entries - page table can only hold ${this.numEntries} entries`
      );
    }

    // Get the existing page table placeholder from core map
    const existingPageTable = this.coreMap.get(pfn);
    if (!existingPageTable) {
      throw new Error(`Expected page table at PFN ${pfn} but none found in coreMap`);
    }

    // Ensure we're not mixing PTEs and PDEs in the same table
    if (existingPageTable.entries.some((entry) => entry.rwx !== null)) {
      throw new Error(`Page table at PFN ${pfn} contains PTEs, not PDEs`);
    }

    // Calculate total entries needed and validate capacity
    const totalEntriesNeeded = existingPageTable.numEntries + numEntries;
    if (totalEntriesNeeded > this.numEntries) {
      throw new Error(
        `Cannot add ${numEntries} entries - would exceed page table capacity of ${this.numEntries} entries`
      );
    }

    // Determine starting index for entries within the page table
    let startIndex = existingPageTable.startIndex;

    if (startIndex === -1) {
      // First time populating - choose random start position
      const maxStartIndex = this.numEntries - totalEntriesNeeded;
      if (maxStartIndex < 0) {
        throw new Error(
          `Cannot fit ${totalEntriesNeeded} total entries in page table of size ${this.numEntries}`
        );
      }
      startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
    } else {
      // Adding to existing table - ensure we don't exceed capacity
      if (startIndex + totalEntriesNeeded > this.numEntries) {
        startIndex = this.numEntries - totalEntriesNeeded;
        if (startIndex < 0) {
          throw new Error(
            `Cannot fit ${totalEntriesNeeded} total entries in page table of size ${this.numEntries}`
          );
        }
      }
    }

    // Generate random page table entries
    const newEntries: PageTableEntry[] = [];
    for (let i = 0; i < numEntries; i++) {
      const entryPfn = Math.floor(Math.random() * (this.maxPfn + 1));

      // Determine if this entry should be valid
      let valid = true;
      if (this.coreMap.has(entryPfn) || Math.random() < this.invalidEntryProbability) {
        valid = false; // Make invalid if PFN collision or random chance
      } else {
        // Reserve this PFN to prevent future collisions
        this.coreMap.set(entryPfn, {
          entries: [],
          tablePfn: entryPfn,
          startIndex: -1,
          numEntries: 0,
        });
      }

      // Set permission bits based on level type
      const rwx = lastLevel ? Math.floor(Math.random() * 8) : null; // PTEs get permissions, PDEs don't

      newEntries.push({
        pfn: entryPfn,
        valid: valid,
        rwx: rwx,
      });
    }

    // Replace one random entry with the correct next-level pointer
    let replacedIndex: number | null = null;
    if (nextLevelPfn !== undefined) {
      replacedIndex = Math.floor(Math.random() * numEntries);

      // For last level, give PTEs higher permission values (4-7) to distinguish from random ones
      const rwx = lastLevel ? Math.floor(Math.random() * 4) + 4 : null;

      newEntries[replacedIndex] = {
        pfn: nextLevelPfn,
        valid: true, // Correct path entries are always valid
        rwx: rwx,
      };
    }

    // Combine existing entries with newly generated ones
    const combinedEntries = [...existingPageTable.entries, ...newEntries];

    // Create the complete page table structure
    const updatedPageTable: PageTable = {
      entries: combinedEntries,
      tablePfn: pfn,
      startIndex: startIndex,
      numEntries: totalEntriesNeeded,
    };

    // Update the core map with the populated page table
    this.coreMap.set(pfn, updatedPageTable);

    return {
      pageTable: updatedPageTable,
      replacedIndex: replacedIndex,
    };
  }

  /**
   * Returns system configuration and calculated parameters
   * Useful for UI components that need to display system information
   */
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

  /**
   * Converts a number to hexadecimal string representation
   *
   * @param num - Number to convert
   * @param padLength - Optional minimum length with zero padding
   * @returns Hexadecimal string with "0x" prefix
   */
  public static toHex(num: number, padLength?: number): string {
    // Convert to unsigned 32-bit integer to handle negative numbers properly
    const unsignedNum = num >>> 0;
    const hex = unsignedNum.toString(16).toUpperCase();
    const padding = padLength ? Math.max(0, padLength - hex.length) : 0;
    return "0x" + "0".repeat(padding) + hex;
  }

  /**
   * Converts a number to binary string representation
   *
   * @param num - Number to convert
   * @param padLength - Minimum length with zero padding
   * @returns Binary string with leading zeros as needed
   */
  public static toBinary(num: number, padLength: number): string {
    const binary = num.toString(2);
    const padding = Math.max(0, padLength - binary.length);
    return "0".repeat(padding) + binary;
  }

  /**
   * Retrieves or generates a page table for display purposes
   *
   * This method is used during interactive exploration to get page tables
   * that may not have been generated yet. It handles both:
   * - Existing page tables from the core map
   * - On-demand generation for exploration of incorrect paths
   *
   * @param pfn - Physical Frame Number of the desired page table
   * @param currentLevel - Level in the page table hierarchy (0 = root)
   * @returns The page table structure ready for display
   */
  public getPageTableForDisplay(pfn: number, currentLevel: number): PageTable {
    // Try to get existing page table from core map
    const existingPageTable = this.coreMap.get(pfn);

    // If it doesn't exist or is empty, generate it on demand
    if (!existingPageTable || existingPageTable.entries.length === 0) {
      return this.populatePageTableOnDemand(pfn, currentLevel);
    }

    return existingPageTable;
  }

  /**
   * Transforms a page table into display format with metadata for visualization
   *
   * This method adds presentation layer information to raw page table data:
   * - Maps array indices to actual page table indices
   * - Identifies which entry is the "correct" one for highlighting
   * - Provides start/end index information for UI rendering
   *
   * @param pageTable - Raw page table data
   * @param correctIndex - Array index of the correct entry (-1 if none)
   * @returns Display-ready data structure with entry metadata
   */
  public getDisplayEntries(pageTable: PageTable, correctIndex: number) {
    return {
      entries: pageTable.entries.map((entry, arrayIndex) => ({
        entry,
        index: pageTable.startIndex + arrayIndex, // Convert to actual page table index
        isCorrect: arrayIndex === correctIndex, // Mark correct entry for highlighting
      })),
      startIndex: pageTable.startIndex,
      endIndex: pageTable.startIndex + pageTable.numEntries - 1,
    };
  }

  /**
   * Breaks down a virtual address into its component parts for visualization
   *
   * This method dissects a virtual address to show:
   * - How many bits are used for each page table level
   * - The actual index values at each level
   * - The page offset bits and value
   * - Binary representations for educational display
   *
   * @param translation - Translation values containing the virtual address
   * @returns Detailed breakdown of virtual address components
   */
  public getVirtualAddressBreakdown(translation: TranslationValues): VirtualAddressBreakdown {
    const indices = [];
    let remainingAddress = translation.virtualAddress;

    // Step 1: Extract page offset (lowest bits)
    const offsetMask = (1 << this.offsetBits) - 1;
    const offsetValue = remainingAddress & offsetMask;
    remainingAddress >>= this.offsetBits;

    // Step 2: Extract page table indices (higher bits, processed in reverse order)
    const indexMask = (1 << this.pageTableBits) - 1;
    for (let i = 0; i < this.pageTableLevels; i++) {
      const indexValue = remainingAddress & indexMask;
      remainingAddress >>= this.pageTableBits;

      // Convert index to binary string for visualization
      let bitsString = "";
      for (let bit = this.pageTableBits - 1; bit >= 0; bit--) {
        bitsString += ((indexValue >> bit) & 1).toString();
      }

      // Add to beginning of array (since we process in reverse order)
      indices.unshift({
        bits: bitsString,
        value: indexValue,
        label: i === this.pageTableLevels - 1 ? "PT Index" : "PD Index",
        startBit: this.offsetBits + i * this.pageTableBits,
      });
    }

    // Step 3: Convert offset to binary string
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

  /**
   * Dynamically generates a page table for exploration scenarios
   *
   * This method is called when users explore "incorrect" paths during
   * interactive translation. It creates realistic page tables on-demand
   * while preventing infinite recursion and maintaining system constraints.
   *
   * @param pfn - Physical Frame Number for the new page table
   * @param currentLevel - Current level in the hierarchy (for recursion control)
   * @param numEntries - Number of entries to generate (default: 7)
   * @returns Populated page table ready for exploration
   */
  public populatePageTableOnDemand(pfn: number, currentLevel: number, numEntries = 7): PageTable {
    // Prevent infinite recursion by enforcing level limits
    if (currentLevel >= this.pageTableLevels) {
      throw new Error(
        `Cannot populate page table at level ${currentLevel} - exceeds maximum levels (${this.pageTableLevels})`
      );
    }

    // Check if table already exists and is populated
    const existingPageTable = this.coreMap.get(pfn);
    if (existingPageTable && existingPageTable.entries.length > 0) {
      return existingPageTable; // Already populated, return as-is
    }

    // Determine entry type based on level
    const isLastLevel = currentLevel === this.pageTableLevels - 1;

    // Choose random starting position within the page table
    const maxStartIndex = this.numEntries - numEntries;
    const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

    const entries: PageTableEntry[] = [];

    // Generate entries with same logic as main generation method
    for (let i = 0; i < numEntries; i++) {
      const entryPfn = Math.floor(Math.random() * (this.maxPfn + 1));

      // Apply validity rules: invalid if PFN collision or random chance
      let valid = true;
      if (this.coreMap.has(entryPfn) || Math.random() < this.invalidEntryProbability) {
        valid = false;
      } else {
        // Reserve PFN to prevent future collisions
        this.coreMap.set(entryPfn, {
          entries: [],
          tablePfn: entryPfn,
          startIndex: -1,
          numEntries: 0,
        });
      }

      // Set permission bits based on level
      let rwx: number | null = null;
      if (isLastLevel) {
        // PTEs get random permission bits (0-7)
        rwx = Math.floor(Math.random() * 8);
      }
      // PDEs keep rwx as null

      entries.push({
        pfn: entryPfn,
        valid: valid,
        rwx: rwx,
      });
    }

    // Create the complete page table structure
    const populatedPageTable: PageTable = {
      entries: entries,
      tablePfn: pfn,
      startIndex: startIndex,
      numEntries: numEntries,
    };

    // Register in core map to prevent future PFN collisions
    this.coreMap.set(pfn, populatedPageTable);

    return populatedPageTable;
  }
}
