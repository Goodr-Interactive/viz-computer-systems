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
 * PIPELINE STAGES CONFIGURATION
 * 
 * These define the stages of the pipeline that instructions go through.
 * The order matters - instructions will progress through stages in this sequence.
 * 
 * Usage:
 * - Add/remove stages by modifying this array
 * - Each stage name will appear as a column header in the visualization
 * - Make sure STAGE_IMAGES array has corresponding icons for each stage
 */
export const PIPELINE_STAGES = [
  "Sort",      // Stage 0: Initial sorting/preparation
  "Wash",      // Stage 1: Washing process
  "Dry",       // Stage 2: Drying process
  "Fold",      // Stage 3: Folding/organizing
  "Put Away"   // Stage 4: Final storage
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
    name: "Load 1 (shirts)", 
    color: "#4285F4",  // Google Blue
    registers: { src: [], dest: [] } 
  },
  { 
    id: 2, 
    name: "Load 2 (pants)", 
    color: "#EA4335",  // Google Red
    registers: { src: [], dest: [] } 
  },
  { 
    id: 3, 
    name: "Load 3 (socks)", 
    color: "#FBBC05",  // Google Yellow
    registers: { src: [], dest: [] } 
  },
  { 
    id: 4, 
    name: "Load 4 (sheets)", 
    color: "#34A853",  // Google Green
    registers: { src: [], dest: [] } 
  },
  { 
    id: 5, 
    name: "Load 5 (jackets)", 
    color: "#8F44AD",  // Purple
    registers: { src: [], dest: [] } 
  },
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

/**
 * SUPERSCALAR CONFIGURATION
 * 
 * Configuration for superscalar pipeline features.
 * 
 * Usage:
 * - DEFAULT_SUPERSCALAR_WIDTH: How many instructions can start per cycle in superscalar mode
 * - IS_SUPERSCALAR_ENABLED: Whether superscalar mode is available
 */
export const SUPERSCALAR_CONFIG = {
  DEFAULT_SUPERSCALAR_WIDTH: 2,
  IS_SUPERSCALAR_ENABLED: true
};
