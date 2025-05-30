/**
 * Pipeline Visualization Configuration
 * 
 * This file contains all the configurable data for the pipeline visualization.
 * You can modify the values here to customize the visualization without 
 * touching the main component code.
 */

// Import SVG assets for pipeline stages
import shirtSvg from "@/assets/shirt.svg";
import washingMachineSvg from "@/assets/washing-machine.svg";
import tumbleDrySvg from "@/assets/tumble-dry.svg";
import handDrySvg from "@/assets/hand-dry.svg";
import closetSvg from "@/assets/closet.svg";

import type { Instruction } from "./types";

/**
 * FEATURE FLAGS CONFIGURATION
 */
export const FEATURE_FLAGS = {
  // Enable/disable pipelined mode by defaults
  IS_PIPELINED_MODE: true, 

  // Enable/disable superscalar mode by default. Requires IS_PIPELINED_MODE to be true.
  IS_SUPERSCALAR_MODE: false, 

  // Default superscalar width
  DEFAULT_SUPERSCALAR_WIDTH: 3,

  // Enable/disable ability to change modes in the UI
  SHOW_MODE_SELECTION: true, 

  // Enable/disable current cycle indicator
  SHOW_CYCLES_INDICATOR: false, 
}

/**
 * PIPELINE STAGES CONFIGURATION
 * 
 * These define the stages of the pipeline that instructions go through.
 * The order matters - instructions will progress through stages in this sequence.
 * 
 * Usage:
 * - Add/remove stages by modifying this array
 * - Each stage name will appear as a column header in the visualization
 * - Make sure STAGE_IMAGES array has corresponding icons for each stage
 * - Make sure STAGE_LENGTHS array has corresponding durations for each stage
 */
export const PIPELINE_STAGES = [
  "Sort",      // Stage 0: Initial sorting/preparation
  "Wash",      // Stage 1: Washing process
  "Dry",       // Stage 2: Drying process
  "Fold",      // Stage 3: Folding/organizing
  "Put Away"   // Stage 4: Final storage
];

/**
 * STAGE LENGTHS CONFIGURATION
 * 
 * Defines the relative duration of each pipeline stage.
 * The longest stage determines the clock period (worst-case timing).
 * All other stages scale proportionally in the visualization.
 * 
 * Usage:
 * - Values represent relative time units (e.g., nanoseconds, cycles, etc.)
 * - The array length must match PIPELINE_STAGES length
 * - The largest value becomes 1.0 (full cycle width) in the visualization
 * - Smaller values scale proportionally (e.g., 0.5 = half cycle width)
 * 
 * Example: If Wash takes 100ns and Dry takes 50ns, Wash gets full width,
 * Dry gets half width, and the clock period is 100ns.
 */
export const STAGE_LENGTHS = [ // at least one should be 30 mins for viz to work/make sense
  5,   // Sort: 5 minutes
  30,  // Wash: 30 minutes (longest - determines clock period)
  30,   // Dry: 30 minutes
  15,   // Fold total minutes
  5    // Put Away: 5 minutes
];

/**
 * STAGE IMAGES CONFIGURATION
 * 
 * SVG icons for each pipeline stage. The array index must match the 
 * corresponding stage in PIPELINE_STAGES.
 * 
 * Usage:
 * - Replace any SVG import with your own icon
 * - Ensure the array length matches PIPELINE_STAGES length
 * - Icons should be SVG format for best scalability
 */
export const STAGE_IMAGES = [
  shirtSvg,         // Icon for "Sort" stage
  washingMachineSvg, // Icon for "Wash" stage
  tumbleDrySvg,     // Icon for "Dry" stage
  handDrySvg,       // Icon for "Fold" stage
  closetSvg         // Icon for "Put Away" stage
];



/**
 * AVAILABLE COLORS CONFIGURATION
 * 
 * Color palette used when adding new instructions dynamically.
 * Colors are cycled through when users add new instructions.
 * 
 * Usage:
 * - Add/remove hex color codes to expand/limit the palette
 * - Colors should be visually distinct for accessibility
 * - Consider color-blind friendly palettes if needed
 */
export const AVAILABLE_COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red  
  "#FBBC05", // Google Yellow
  "#34A853", // Google Green
  "#8F44AD", // Purple
  "#FF5722", // Deep Orange
  "#009688", // Teal
  "#673AB7", // Deep Purple
  "#3F51B5", // Indigo
  "#00BCD4", // Cyan
  "#607D8B", // Blue Grey
  "#795548", // Brown
  "#9C27B0", // Purple
  "#2196F3", // Blue
  "#FF9800", // Orange
];

/**
 * DEFAULT INSTRUCTIONS CONFIGURATION
 * 
 * These are the initial instructions that appear when the visualization loads.
 * Each instruction represents a "load" of laundry that goes through the pipeline.
 * 
 * Usage:
 * - Add/remove instructions by modifying this array
 * - Each instruction needs: id (unique number), name (display text), color (hex), registers (empty for laundry sim)
 * - Colors should be hex codes for consistent styling
 * - IDs should be sequential starting from 1
 */
export const DEFAULT_INSTRUCTIONS: Instruction[] = [
  { 
    id: 1, 
    name: "Shirts", 
    color: AVAILABLE_COLORS[0],  // Google Blue
    registers: { src: [], dest: [] } 
  },
  { 
    id: 2, 
    name: "Pants", 
    color: AVAILABLE_COLORS[1],  // Google Red
    registers: { src: [], dest: [] } 
  },
  { 
    id: 3, 
    name: "Socks", 
    color: AVAILABLE_COLORS[2],  // Google Yellow
    registers: { src: [], dest: [] } 
  },
  { 
    id: 4, 
    name: "Sheets", 
    color: AVAILABLE_COLORS[3],  // Google Green
    registers: { src: [], dest: [] } 
  },
  { 
    id: 5, 
    name: "Jackets", 
    color: AVAILABLE_COLORS[4],  // Purple
    registers: { src: [], dest: [] } 
  },
  // loads for showing additional features (uncomment to use)
  /** 
  {
    id: 6, 
    name: "Friend's Socks", 
    color: AVAILABLE_COLORS[5],  // Google Yellow
    registers: { src: [], dest: [] } 
  },
  { 
    id: 7, 
    name: "Friend's Pants", 
    color: AVAILABLE_COLORS[6],  // Google Green
    registers: { src: [], dest: [] } 
  },
  { 
    id: 8, 
    name: "Friend's Socks", 
    color: AVAILABLE_COLORS[7],  // Google Yellow
    registers: { src: [], dest: [] } 
  },
  { 
    id: 9, 
    name: "Friend's Sheets", 
    color: AVAILABLE_COLORS[8],  // Google Green
    registers: { src: [], dest: [] } 
  },
  { 
    id: 10, 
    name: "Friend's Jackets", 
    color: AVAILABLE_COLORS[9],  // Purple
    registers: { src: [], dest: [] } 
  },
  */
];


/**
 * TIMING CONFIGURATION
 * 
 * Configuration for the time display and cycle timing.
 * 
 * Usage:
 * - CYCLE_DURATION_MINUTES: How many real-world minutes each cycle represents
 * - START_TIME_HOUR: What time the visualization starts at (24-hour format)
 * - DEFAULT_SPEED_MS: Default animation speed in milliseconds between cycles
 */
export const TIMING_CONFIG = {
  CYCLE_DURATION_MINUTES: 30,  // Each cycle = 30 minutes of real time
  START_TIME_HOUR: 9,          // Start at 9:00 AM
  DEFAULT_SPEED_MS: 1000,      // 1 second between cycles by default
};

/**
 * PERFORMANCE METRICS CONFIGURATION
 * 
 * Configuration for performance metrics display.
 * 
 * Usage:
 * - SHOW_LOADS_PER_HOUR: Whether to display loads per hour metric
 * - LOADS_PER_HOUR_LABEL: Custom label for the loads per hour metric
 * - METRIC_DISPLAY_PRECISION: Number of decimal places to show
 */
export const PERFORMANCE_CONFIG = {
  SHOW_LOADS_PER_HOUR: true,           // Show loads per hour metric
  LOADS_PER_HOUR_LABEL: "Loads Per Hour", // Label for the metric
  METRIC_DISPLAY_PRECISION: 1,         // Show 1 decimal place
};

/**
 * STAGE SCALING UTILITIES
 * 
 * Helper functions to calculate stage scaling based on stage lengths.
 */

/**
 * Get the maximum stage length (determines clock period)
 */
export const getMaxStageLength = (): number => {
  return Math.max(...STAGE_LENGTHS);
};

/**
 * Get the scaling factor for a specific stage (0.0 to 1.0)
 * @param stageIndex - Index of the stage in PIPELINE_STAGES
 * @returns Scaling factor where 1.0 = full cycle width
 */
export const getStageScalingFactor = (stageIndex: number): number => {
  if (stageIndex < 0 || stageIndex >= STAGE_LENGTHS.length) {
    return 1.0; // Default to full width for invalid indices
  }
  return STAGE_LENGTHS[stageIndex] / getMaxStageLength();
};

/**
 * Get all stage scaling factors
 * @returns Array of scaling factors (0.0 to 1.0) for each stage
 */
export const getAllStageScalingFactors = (): number[] => {
  const maxLength = getMaxStageLength();
  return STAGE_LENGTHS.map(length => length / maxLength);
};

/**
 * Get stage length information for display
 * @returns Object with max length, lengths array, and scaling factors
 */
export const getStageTimingInfo = () => {
  const maxLength = getMaxStageLength();
  const scalingFactors = getAllStageScalingFactors();
  
  return {
    maxStageLength: maxLength,
    stageLengths: [...STAGE_LENGTHS],
    stageScalingFactors: scalingFactors,
    clockPeriod: maxLength, // Clock period is determined by longest stage
  };
};

/**
 * VISUALIZATION LAYOUT CONFIGURATION
 * 
 * Layout and sizing configuration for the visualization.
 * 
 * Usage:
 * - MARGINS: Space around the chart (top, right, bottom, left)
 * - CONTAINER_HEIGHT: Default height of the visualization container
 * - MIN_HEIGHT: Minimum height when resizing
 * - BAND_PADDING: Space between chart elements (0-1, where 1 = no padding)
 */
export const LAYOUT_CONFIG = {
  MARGINS: {
    top: 50,
    right: 30, 
    bottom: 80,  // Extra space for x-axis label
    left: 120    // Extra space for y-axis labels
  },
  CONTAINER_HEIGHT: 700,      // Height in pixels
  MIN_HEIGHT: 400,           // Minimum height when resizing
  BAND_PADDING: {
    cycles: 0.02,            // Padding between cycle columns
    instructions: 0.1        // Padding between instruction rows
  }
};
