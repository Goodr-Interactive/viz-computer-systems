import { PhysicalMemorySize, PageSize, VirtualAddressBits } from "./types";

/**
 * INSTRUCTOR CONFIGURATION
 * 
 * This file allows you to customize which options appear in the dropdown menus.
 * Simply comment out or remove any options you don't want to show to students.
 * You can also add new options by defining new values in the types.ts file first.
 */

export const instructorConfig = {
  // Physical Memory Size Options
  // Add or remove options as needed for your course
  physicalMemoryOptions: [
    { value: PhysicalMemorySize.MB_128, label: "128 MB" },
    { value: PhysicalMemorySize.MB_256, label: "256 MB" },
    { value: PhysicalMemorySize.MB_512, label: "512 MB" },
    { value: PhysicalMemorySize.GB_1, label: "1 GB" },
    { value: PhysicalMemorySize.GB_2, label: "2 GB" },
    { value: PhysicalMemorySize.GB_4, label: "4 GB" },
  ],

  // Page Size Options
  // Modify this list to show only the page sizes relevant to your lessons
  pageSizeOptions: [
    { value: PageSize.B_512, label: "512 B" },
    { value: PageSize.KB_1, label: "1 KB" },
    { value: PageSize.KB_2, label: "2 KB" },
    { value: PageSize.KB_4, label: "4 KB" },
    { value: PageSize.KB_8, label: "8 KB" },
    { value: PageSize.KB_16, label: "16 KB" },
  ],

  // Virtual Address Bits Options
  // Customize which virtual address bit counts to show
  virtualBitsOptions: [
    { value: VirtualAddressBits.BITS_16, label: "16 bits" },
    { value: VirtualAddressBits.BITS_18, label: "18 bits" },
    { value: VirtualAddressBits.BITS_20, label: "20 bits" },
    { value: VirtualAddressBits.BITS_24, label: "24 bits" },
    { value: VirtualAddressBits.BITS_26, label: "26 bits" },
    { value: VirtualAddressBits.BITS_28, label: "28 bits" },
    { value: VirtualAddressBits.BITS_30, label: "30 bits" },
  ],

  // Default Values
  // Set the initial values that appear when the page loads
  defaults: {
    physicalMemory: PhysicalMemorySize.GB_1,
    pageSize: PageSize.KB_4, // Changed from B_512 to KB_4 (more common default)
    virtualBits: VirtualAddressBits.BITS_30,
  },
};

/**
 * QUICK PRESETS FOR COMMON SCENARIOS
 * 
 * Uncomment one of these sections to quickly configure for specific lessons:
 */

// // For introductory lessons (simpler options)
// export const instructorConfig = {
//   physicalMemoryOptions: [
//     { value: PhysicalMemorySize.MB_256, label: "256 MB" },
//     { value: PhysicalMemorySize.MB_512, label: "512 MB" },
//     { value: PhysicalMemorySize.GB_1, label: "1 GB" },
//   ],
//   pageSizeOptions: [
//     { value: PageSize.KB_1, label: "1 KB" },
//     { value: PageSize.KB_4, label: "4 KB" },
//   ],
//   virtualBitsOptions: [
//     { value: VirtualAddressBits.BITS_20, label: "20 bits" },
//     { value: VirtualAddressBits.BITS_24, label: "24 bits" },
//     { value: VirtualAddressBits.BITS_28, label: "28 bits" },
//   ],
//   defaults: {
//     physicalMemory: PhysicalMemorySize.MB_512,
//     pageSize: PageSize.KB_4,
//     virtualBits: VirtualAddressBits.BITS_24,
//   },
// };

// // For advanced lessons (more options)
// export const instructorConfig = {
//   physicalMemoryOptions: [
//     { value: PhysicalMemorySize.MB_128, label: "128 MB" },
//     { value: PhysicalMemorySize.MB_256, label: "256 MB" },
//     { value: PhysicalMemorySize.MB_512, label: "512 MB" },
//     { value: PhysicalMemorySize.GB_1, label: "1 GB" },
//     { value: PhysicalMemorySize.GB_2, label: "2 GB" },
//     { value: PhysicalMemorySize.GB_4, label: "4 GB" },
//   ],
//   pageSizeOptions: [
//     { value: PageSize.B_512, label: "512 B" },
//     { value: PageSize.KB_1, label: "1 KB" },
//     { value: PageSize.KB_2, label: "2 KB" },
//     { value: PageSize.KB_4, label: "4 KB" },
//     { value: PageSize.KB_8, label: "8 KB" },
//     { value: PageSize.KB_16, label: "16 KB" },
//   ],
//   virtualBitsOptions: [
//     { value: VirtualAddressBits.BITS_16, label: "16 bits" },
//     { value: VirtualAddressBits.BITS_18, label: "18 bits" },
//     { value: VirtualAddressBits.BITS_20, label: "20 bits" },
//     { value: VirtualAddressBits.BITS_24, label: "24 bits" },
//     { value: VirtualAddressBits.BITS_26, label: "26 bits" },
//     { value: VirtualAddressBits.BITS_28, label: "28 bits" },
//     { value: VirtualAddressBits.BITS_30, label: "30 bits" },
//   ],
//   defaults: {
//     physicalMemory: PhysicalMemorySize.GB_1,
//     pageSize: PageSize.KB_4,
//     virtualBits: VirtualAddressBits.BITS_30,
//   },
// }; 