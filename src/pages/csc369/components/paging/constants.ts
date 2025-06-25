import { PhysicalMemorySize, PageSize, VirtualAddressBits } from "./types";

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
    hover: "group-hover:bg-indigo-200",
  },
  {
    background: "bg-purple-100",
    border: "border-purple-300",
    hover: "group-hover:bg-purple-200",
  },
  {
    background: "bg-pink-100",
    border: "border-pink-300",
    hover: "group-hover:bg-pink-200",
  },
];

export const physicalMemoryOptions = [
  { value: PhysicalMemorySize.MB_128, label: "128 MB" },
  { value: PhysicalMemorySize.MB_256, label: "256 MB" },
  { value: PhysicalMemorySize.MB_512, label: "512 MB" },
  { value: PhysicalMemorySize.GB_1, label: "1 GB" },
  { value: PhysicalMemorySize.GB_2, label: "2 GB" },
  { value: PhysicalMemorySize.GB_4, label: "4 GB" },
];

export const pageSizeOptions = [
  { value: PageSize.B_512, label: "512 B" },
  { value: PageSize.KB_1, label: "1 KB" },
  { value: PageSize.KB_2, label: "2 KB" },
  { value: PageSize.KB_4, label: "4 KB" },
  { value: PageSize.KB_8, label: "8 KB" },
  { value: PageSize.KB_16, label: "16 KB" },
];

export const virtualBitsOptions = [
  { value: VirtualAddressBits.BITS_16, label: "16 bits" },
  { value: VirtualAddressBits.BITS_18, label: "18 bits" },
  { value: VirtualAddressBits.BITS_20, label: "20 bits" },
  { value: VirtualAddressBits.BITS_24, label: "24 bits" },
  { value: VirtualAddressBits.BITS_26, label: "26 bits" },
  { value: VirtualAddressBits.BITS_28, label: "28 bits" },
  { value: VirtualAddressBits.BITS_30, label: "30 bits" },
];

// Colors for PDBR, Physical PFN, and Virtual Offset blocks
export const physicalPfnColor = "bg-sky-100";
export const physicalPfnBorder = "border-sky-300";
export const physicalPfnColorHover = "group-hover:bg-sky-200";

export const pdbrColor = "bg-gray-100";
export const pdbrBorder = "border-gray-300";
export const pdbrColorHover = "group-hover:bg-gray-200";

export const virtualOffsetColor = "bg-emerald-100";
export const virtualOffsetBorder = "border-emerald-300";
export const virtualOffsetColorHover = "group-hover:bg-emerald-200";

/**
 * Translation Example Constants
 */
export const translationExampleConstants = {
  // Entry size in bytes (32-bit entries)
  pageTableEntrySize: 4,

  // Display configuration
  initialHexDisplay: true,
  initialTestMode: false,
  initialHexHintMode: false,
} as const;

/**
 * UI Layout Constants
 */
export const uiConstants = {
  // Spacing
  sectionGap: "gap-10",
  containerPadding: "p-8",
  bottomPadding: "pb-24",

  // Widths
  maxContainerWidth: "max-w-7xl",
  fullWidth: "w-full",

  // Flexbox
  flexColCenter: "flex w-full flex-col items-center",
} as const;
