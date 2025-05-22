/**
 * Represents the physical memory size options in bytes
 */
export enum PhysicalMemorySize {
  MB_128 = 128 * 1024 * 1024,
  MB_256 = 256 * 1024 * 1024,
  MB_512 = 512 * 1024 * 1024,
  GB_1 = 1 * 1024 * 1024 * 1024,
  GB_2 = 2 * 1024 * 1024 * 1024,
  GB_4 = 4 * 1024 * 1024 * 1024,
}

/**
 * Represents the page size options in bytes
 */
export enum PageSize {
  B_512 = 512,
  KB_1 = 1 * 1024,
  KB_2 = 2 * 1024,
  KB_4 = 4 * 1024,
  KB_8 = 8 * 1024,
  KB_16 = 16 * 1024,
}

/**
 * Represents the virtual address space size in bits
 */
export enum VirtualAddressBits {
  BITS_16 = 16,
  BITS_18 = 18,
  BITS_20 = 20,
  BITS_24 = 24,
  BITS_26 = 26,
  BITS_28 = 28,
  BITS_30 = 30,
}

/**
 * Predefined colors for each page table level
 */
export interface PageTableLevelColor {
  background: string;
  border: string;
  hover: string;
}

export const PageTableLevelColors: PageTableLevelColor[] = [
  {
    background: "bg-indigo-100",
    border: "border-indigo-300",
    hover: "group-hover:bg-indigo-200"
  },
  {
    background: "bg-purple-100",
    border: "border-purple-300",
    hover: "group-hover:bg-purple-200"
  },
  {
    background: "bg-pink-100",
    border: "border-pink-300",
    hover: "group-hover:bg-pink-200"
  }
];

/**
 * Represents a paging system with specific configuration parameters
 */
export class PagingSystem {
  // Input parameters
  private readonly physicalMemorySize: PhysicalMemorySize;
  private readonly pageSize: PageSize;
  private readonly virtualAddressBits: VirtualAddressBits;
  private readonly pteSize: number = 4; // 32 bits = 4 bytes

  /**
   * Creates a new PagingSystem with the specified parameters
   */
  constructor(
    physicalMemorySize: PhysicalMemorySize,
    pageSize: PageSize,
    virtualAddressBits: VirtualAddressBits
  ) {
    this.physicalMemorySize = physicalMemorySize;
    this.pageSize = pageSize;
    this.virtualAddressBits = virtualAddressBits;
  }

  /**
   * Gets the size of physical memory in bytes
   */
  getPhysicalMemorySize(): number {
    return this.physicalMemorySize;
  }

  /**
   * Gets the size of a page in bytes
   */
  getPageSize(): number {
    return this.pageSize;
  }

  /**
   * Gets the number of bits in the virtual address space
   */
  getVirtualAddressBits(): number {
    return this.virtualAddressBits;
  }

  /**
   * Gets the size of the virtual address space in bytes
   */
  getVirtualAddressSpace(): number {
    return Math.pow(2, this.virtualAddressBits);
  }

  /**
   * Gets the number of bits used for the page offset
   */
  getPageOffsetBits(): number {
    return Math.log2(this.pageSize);
  }

  /**
   * Gets the number of bits used for the virtual page number (VPN)
   */
  getVpnBits(): number {
    return this.virtualAddressBits - this.getPageOffsetBits();
  }

  /**
   * Gets the total number of pages in the virtual address space
   */
  getTotalVirtualPages(): number {
    return Math.pow(2, this.getVpnBits());
  }

  /**
   * Gets the number of bits used for the physical frame number (PFN)
   */
  getPfnBits(): number {
    const totalPhysicalFrames = this.physicalMemorySize / this.pageSize;
    return Math.ceil(Math.log2(totalPhysicalFrames));
  }

  /**
   * Gets the total number of frames in physical memory
   */
  getTotalPhysicalFrames(): number {
    return this.physicalMemorySize / this.pageSize;
  }

  /**
   * Gets the number of page table entries (PTEs) that can fit in a single page
   */
  getPtesPerPage(): number {
    return Math.floor(this.pageSize / this.pteSize);
  }

  /**
   * Gets the number of bits required to index the PTEs within a page
   */
  getPteIndexBits(): number {
    return Math.log2(this.getPtesPerPage());
  }

  /**
   * Gets the number of levels required in the page table hierarchy
   */
  getPageTableLevels(): number {
    const pteIndexBits = this.getPteIndexBits();
    const vpnBits = this.getVpnBits();
    return Math.ceil(vpnBits / pteIndexBits);
  }

  /**
   * Gets the bits used at each level of the page table hierarchy
   */
  getBitsPerLevel(): number[] {
    const pteIndexBits = this.getPteIndexBits();
    const vpnBits = this.getVpnBits();
    const levels = this.getPageTableLevels();
    
    const bitsPerLevel: number[] = [];
    let remainingBits = vpnBits;
    
    for (let i = 0; i < levels; i++) {
      if (i === levels - 1) {
        // Last level gets all remaining bits
        bitsPerLevel.push(remainingBits);
      } else {
        // Other levels get pteIndexBits
        bitsPerLevel.push(pteIndexBits);
        remainingBits -= pteIndexBits;
      }
    }
    
    return bitsPerLevel;
  }

  /**
   * Gets a summary of the paging system configuration
   */
  getSummary(): {
    physicalMemorySize: number;
    pageSize: number;
    virtualAddressBits: number;
    virtualAddressSpace: number;
    pageOffsetBits: number;
    vpnBits: number;
    pfnBits: number;
    totalVirtualPages: number;
    totalPhysicalFrames: number;
    ptesPerPage: number;
    pteIndexBits: number;
    pageTableLevels: number;
    bitsPerLevel: number[];
  } {
    return {
      physicalMemorySize: this.physicalMemorySize,
      pageSize: this.pageSize,
      virtualAddressBits: this.virtualAddressBits,
      virtualAddressSpace: this.getVirtualAddressSpace(),
      pageOffsetBits: this.getPageOffsetBits(),
      vpnBits: this.getVpnBits(),
      pfnBits: this.getPfnBits(),
      totalVirtualPages: this.getTotalVirtualPages(),
      totalPhysicalFrames: this.getTotalPhysicalFrames(),
      ptesPerPage: this.getPtesPerPage(),
      pteIndexBits: this.getPteIndexBits(),
      pageTableLevels: this.getPageTableLevels(),
      bitsPerLevel: this.getBitsPerLevel(),
    };
  }

  /**
   * Helper method to format a byte size to a human-readable string
   */
  static formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value} ${units[unitIndex]}`;
  }
} 