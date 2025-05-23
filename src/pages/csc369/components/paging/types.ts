export interface BinaryBlockProps {
  /**
   * Number of blocks to render
   */
  blocks: number;
  /**
   * Background color for the blocks
   */
  color?: string;
  /**
   * Border color for the blocks
   */
  borderColor?: string;
  /**
   * Hover color class for blocks (full Tailwind class name)
   */
  hoverColor?: string;
  /**
   * Tooltip content to display on hover
   */
  tooltip?: React.ReactNode;
  /**
   * Show left border on the first block
   */
  showLeftBorder?: boolean;
  /**
   * Label to display below the blocks
   */
  label?: React.ReactNode;
  /**
   * Starting bit number (for continuous numbering across multiple blocks)
   */
  startBitNumber?: number;
  /**
   * Whether to show bit numbers
   */
  showBitNumbers?: boolean;
  /**
   * Optional class name for styling
   */
  className?: string;
  /**
   * Optional click handler for the entire block group
   */
  onClick?: () => void;
}

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