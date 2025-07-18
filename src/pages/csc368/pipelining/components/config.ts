/**
 * Pipeline Visualization Configuration
 *
 * This file contains all the configurable data for the pipeline visualization.
 * You can modify the values here to customize the visualization without
 * touching the main component code.
 */

// Import SVG assets for pipeline stages
import washingMachineSvg from "@/assets/washing-machine.svg";
import tumbleDrySvg from "@/assets/tumble-dry.svg";
import handDrySvg from "@/assets/hand-dry.svg";
import closetSvg from "@/assets/closet.svg";

import type { Instruction } from "./types";

/**
 * FEATURE FLAGS CONFIGURATION
 */
export const FEATURE_FLAGS = {
  // Enable/disable pipelined mode by default
  // Start with non-pipelined to show the contrast like in the textbook
  IS_PIPELINED_MODE: false,

  // Enable/disable superscalar mode by default. Requires IS_PIPELINED_MODE to be true.
  IS_SUPERSCALAR_MODE: false,

  // Default superscalar width
  DEFAULT_SUPERSCALAR_WIDTH: 2,

  // Enable/disable ability to change modes in the UI
  SHOW_MODE_SELECTION: true,

  // Enable/disable current cycle indicator
  SHOW_CYCLES_INDICATOR: false,
};

/**
 * PIPELINE STAGES CONFIGURATION
 *
 * These define the stages of the pipeline that instructions go through.
 * The order matters - instructions will progress through stages in this sequence.
 * These match the exact naming from the Hennessy & Patterson textbook.
 *
 * Usage:
 * - Add/remove stages by modifying this array
 * - Each stage name will appear as a column header in the visualization
 * - Make sure STAGE_IMAGES array has corresponding icons for each stage
 * - Make sure STAGE_LENGTHS array has corresponding durations for each stage
 */
export const PIPELINE_STAGES = [
  "Washer", // Stage 0: Washing process
  "Dryer", // Stage 1: Drying process
  "Folder", // Stage 2: Folding/organizing
  "Storer", // Stage 3: Final storage
];

/**
 * STAGE LENGTHS CONFIGURATION
 *
 * Defines the relative duration of each pipeline stage.
 * In the classic Hennessy & Patterson textbook, each stage takes exactly 30 minutes.
 * This matches the textbook example exactly.
 *
 * Usage:
 * - Values represent relative time units (e.g., minutes, cycles, etc.)
 * - The array length must match PIPELINE_STAGES length
 * - All stages have equal duration as specified in the textbook
 */
export const STAGE_LENGTHS = [
  30, // Washer: 30 minutes
  30, // Dryer: 30 minutes
  30, // Folder: 30 minutes
  30, // Storer: 30 minutes
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
  washingMachineSvg, // Icon for "Washer" stage
  tumbleDrySvg, // Icon for "Dryer" stage
  handDrySvg, // Icon for "Folder" stage
  closetSvg, // Icon for "Storer" stage
];

/**
 * STAGE COLORS CONFIGURATION
 *
 * Each pipeline stage has its own consistent color, matching the
 * Hennessy & Patterson textbook approach where stages are color-coded
 * rather than individual tasks. These colors match the classic textbook.
 *
 * Usage:
 * - Each color corresponds to a stage in PIPELINE_STAGES
 * - Colors should be visually distinct for accessibility
 * - Array length must match PIPELINE_STAGES length
 */
export const STAGE_COLORS = [
  "#87CEEB", // Washer - Light Blue (classic textbook wash color)
  "#FFB6C1", // Dryer - Light Pink (classic textbook dry color)
  "#98FB98", // Folder - Light Green (classic textbook fold color)
  "#DDA0DD", // Storer - Light Purple (classic textbook put away color)
];

/**
 * AVAILABLE_COLORS CONFIGURATION
 *
 * Color palette used when adding new instructions dynamically.
 * These are neutral colors for the task labels/borders.
 *
 * Usage:
 * - Add/remove hex color codes to expand/limit the palette
 * - Colors should be visually distinct for accessibility
 * - Consider color-blind friendly palettes if needed
 */
export const AVAILABLE_COLORS = [
  "#666666", // Dark Gray - Task A
  "#666666", // Dark Gray - Task B
  "#666666", // Dark Gray - Task C
  "#666666", // Dark Gray - Task D
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
 * These match the classic Hennessy & Patterson example (Task A, B, C, D).
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
    name: "Task A",
    color: AVAILABLE_COLORS[0], // Blue
    registers: { src: [], dest: [] },
  },
  {
    id: 2,
    name: "Task B",
    color: AVAILABLE_COLORS[1], // Red
    registers: { src: [], dest: [] },
  },
  {
    id: 3,
    name: "Task C",
    color: AVAILABLE_COLORS[2], // Yellow
    registers: { src: [], dest: [] },
  },
  {
    id: 4,
    name: "Task D",
    color: AVAILABLE_COLORS[3], // Green
    registers: { src: [], dest: [] },
  },
];

/**
 * TIMING CONFIGURATION
 *
 * Configuration for the time display and cycle timing.
 * Matches the classic Hennessy & Patterson laundry example exactly.
 *
 * Usage:
 * - CYCLE_DURATION_MINUTES: How many real-world minutes each cycle represents
 * - START_TIME_HOUR: What time the visualization starts at (24-hour format)
 * - DEFAULT_SPEED_MS: Default animation speed in milliseconds between cycles
 */
export const TIMING_CONFIG = {
  CYCLE_DURATION_MINUTES: 30, // Each cycle = 30 minutes (textbook example)
  START_TIME_HOUR: 18, // Start at 6:00 PM (classic example)
  DEFAULT_SPEED_MS: 1000, // 1 second between cycles by default
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
  SHOW_LOADS_PER_HOUR: true, // Show loads per hour metric
  LOADS_PER_HOUR_LABEL: "Tasks Per Hour", // Label for the metric
  METRIC_DISPLAY_PRECISION: 1, // Show 1 decimal place
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
  return STAGE_LENGTHS.map((length) => length / maxLength);
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
    bottom: 80, // Extra space for x-axis label
    left: 120, // Extra space for y-axis labels
  },
  CONTAINER_HEIGHT: 700, // Height in pixels
  MIN_HEIGHT: 400, // Minimum height when resizing
  BAND_PADDING: {
    cycles: 0.02, // Padding between cycle columns
    instructions: 0.1, // Padding between instruction rows
  },
};
