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
  /**
   * Optional array of digits to display inside each block (monospaced)
   * Array length should match the number of blocks
   */
  digits?: Array<string | number>;
}

/**
 * Represents the physical memory size options in bytes
 */
export const PhysicalMemorySize = {
  KB_1: 1 * 1024,
  KB_32: 32 * 1024,
  KB_64: 64 * 1024,
  MB_1: 1 * 1024 * 1024,
  MB_16: 16 * 1024 * 1024,
  MB_128: 128 * 1024 * 1024,
  MB_256: 256 * 1024 * 1024,
  MB_512: 512 * 1024 * 1024,
  GB_1: 1 * 1024 * 1024 * 1024,
  GB_2: 2 * 1024 * 1024 * 1024,
  GB_4: 4 * 1024 * 1024 * 1024,
} as const;

export type PhysicalMemorySize = (typeof PhysicalMemorySize)[keyof typeof PhysicalMemorySize];

/**
 * Represents the page size options in bytes
 */
export const PageSize = {
  B_64: 64,
  B_128: 128,
  B_256: 256,
  B_512: 512,
  KB_1: 1 * 1024,
  KB_2: 2 * 1024,
  KB_4: 4 * 1024,
  KB_8: 8 * 1024,
  KB_16: 16 * 1024,
} as const;

export type PageSize = (typeof PageSize)[keyof typeof PageSize];

/**
 * Represents the virtual address space size in bits
 */
export const VirtualAddressBits = {
  BITS_16: 16,
  BITS_18: 18,
  BITS_20: 20,
  BITS_24: 24,
  BITS_26: 26,
  BITS_28: 28,
  BITS_30: 30,
} as const;

export type VirtualAddressBits = (typeof VirtualAddressBits)[keyof typeof VirtualAddressBits];

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value} ${units[unitIndex]}`;
}
