/**
 * constants.js - Configuration constants and color palettes for the FIPER visualization
 * 
 * This file defines all layout dimensions, spacing constants, and color schemes
 * used throughout the visualization interface.
 */

const d3 = require('d3');

// ============================================
// LAYOUT CONSTANTS
// ============================================

/** Height in pixels of a single feature row in the visualization */
export const SINGLE_FEATURE_HEIGHT = 30;

/** Width in pixels of the feature importance column */
export const FI_COLUMN_WIDTH = 75;

/** Width in pixels of the rules/distribution column */
export const RULES_COLUMN_WIDTH = 300;

/** Width in pixels of the feature labels column */
export const LABELS_COLUMN_WIDTH = 250;

/** Width in pixels for each counter-rule column in the grid */
export const CRULES_GRID_COLUMN_WIDTH = 20;

/** Horizontal spacing (gutter) between UI elements in pixels */
export const GUTTER = 10;

/** Vertical spacing between UI elements in pixels */
export const VERTICAL_GUTTER = 5;

/** Total height of the menu area at the top of the visualization */
export const MENU_HEIGHT = SINGLE_FEATURE_HEIGHT * 4;

/** Font size in pixels for text elements */
export const FONT_SIZE = 11;

/** Overall width of the visualization in pixels */
export const GLOBAL_WIDTH = 700;

/**
 * D3 event dispatcher for handling user interactions
 * 
 * Events:
 * - changeCounterRule: Fired when user selects a different counter-rule
 * - changeOrder: Fired when user changes the feature ordering
 * - changeFilter: Fired when user applies/removes filters
 * - changePalette: Fired when user switches color palettes
 * - changeTextualFormat: Fired when toggling between graphical/textual explanations
 * - changeProgressStep: Fired when user navigates through explanation steps
 */
export const dispatcher = d3.dispatch('changeCounterRule',
  'changeOrder', 'changeFilter', 'changePalette', 'changeTextualFormat', 'changeProgressStep');

/**
 * Utility function to darken a color by a specified amount
 * 
 * @param {string} color - The color to darken (in any CSS color format)
 * @param {number} amount - The amount to darken (0-1, higher = darker)
 * @returns {string} The darkened color in string format
 */
function darkenColor(color, amount) {
  return d3.hsl(color).darker(amount).toString();
}

// ============================================
// COLOR PALETTES
// ============================================

/**
 * Color palette configurations for different viewing modes
 * 
 * Each palette provides consistent colors for all visualization elements:
 * - Background and text colors
 * - Rule and counter-rule colors
 * - Feature importance indicators
 * - Distribution and instance markers
 * - Grid and stroke colors
 * 
 * Available palettes:
 * - default: Light theme with blue and purple tones
 * - darkModeColorPalette: Dark theme optimized for low-light viewing
 * - grayscaleHighContrast: High-contrast grayscale for accessibility
 */
export const colorSet = {
  /** Default light color palette */
  default: {
    BACKGROUND_COLOR: '#f0f5f9',                      // Main background color
    CRULES_COLOR: 'rgba(128, 90, 162, 1)',            // Counter-rules visualization color (purple)
    CRULES_STROKE_COLOR: 'rgba(106, 74, 135, 1)',     // Counter-rules border color
    RULE_COLOR: 'rgba(205, 133, 63, 1)',              // Rules visualization color (orange)
    RULE_STROKE_COLOR: 'rgba(169, 110, 52, 1)',       // Rules border color
    BASE_COLOR: '#b8d0eb',                            // Base UI elements color
    BASE_STROKE_COLOR: '#9ab0c8',                     // Base elements border color
    SECONDARY_BACKGROUND_COLOR: '#f9fafc',            // Secondary background for panels
    TEXT_COLOR: '#2d3748',                            // Primary text color
    VALUE_TEXT_COLOR: 'rgba(72, 105, 159, 0.85)',     // Feature value text color
    OTHER_TEXT_COLOR: 'rgba(45, 55, 72, 0.8)',        // Secondary text color
    INSTANCE_COLOR: '#1a202c',                        // Instance marker color
    DISTRIBUTION_COLOR: '#e2e8f0',                    // Distribution visualization fill color
    DISTRIBUTION_STROKE_COLOR: '#a0aec0',             // Distribution border color
    CATEGORICAL_INSTANCE_COLOR: '#a3b8cc',            // Categorical feature instance color
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#64748b',     // Categorical instance border
    FI_POSITIVE_COLOR: '#4b7561',                     // Positive feature importance color
    NEGATIVE_FI_COLOR: '#73584E',                     // Negative feature importance color
    GRID_COLOR: '#2d3748',                            // Grid lines color
  },
  
  /** Dark mode color palette optimized for low-light environments */
  darkModeColorPalette: {
    BACKGROUND_COLOR: '#263135',                      // Dark background
    CRULES_COLOR: 'rgb(190,148,224)',                 // Lighter purple for counter-rules
    CRULES_STROKE_COLOR: 'rgb(154,125,179)',          // Counter-rules border
    RULE_COLOR: 'rgba(215, 155, 95, 1)',              // Brighter orange for rules
    RULE_STROKE_COLOR: 'rgba(235, 175, 115, 1)',      // Rules border
    BASE_COLOR: '#3a526f',                            // Dark base color
    BASE_STROKE_COLOR: '#7d8fbc',                     // Base border color
    SECONDARY_BACKGROUND_COLOR: '#22272e',            // Darker secondary background
    TEXT_COLOR: '#e2e8f0',                            // Light text for dark background
    VALUE_TEXT_COLOR: 'rgba(180, 200, 230, 0.9)',     // Light blue value text
    OTHER_TEXT_COLOR: 'rgba(220, 225, 235, 0.8)',     // Light secondary text
    INSTANCE_COLOR: '#f8fafc',                        // Light instance marker
    DISTRIBUTION_COLOR: '#3d4d65',                    // Dark distribution fill
    DISTRIBUTION_STROKE_COLOR: '#5a6d8a',             // Distribution border
    CATEGORICAL_INSTANCE_COLOR: '#4e6080',            // Dark categorical instance
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#7b8fb6',     // Categorical instance border
    FI_POSITIVE_COLOR: '#608176',                     // Positive FI in dark mode
    NEGATIVE_FI_COLOR: '#73635f',                     // Negative FI in dark mode
    GRID_COLOR: '#d2d2dc',                            // Light grid for dark background
  },
  
  /** High-contrast grayscale palette for accessibility (colorblind-friendly) */
  grayscaleHighContrast: {
    BACKGROUND_COLOR: '#f8f8f8',                      // Very light gray background
    CRULES_COLOR: 'rgba(80,80,80,1)',                 // Dark gray for counter-rules
    CRULES_STROKE_COLOR: 'rgba(50,50,50,1)',          // Darker gray for borders
    RULE_COLOR: 'rgba(150,150,150,1)',                // Medium gray for rules
    RULE_STROKE_COLOR: 'rgba(100,100,100,1)',         // Darker gray for rule borders
    BASE_COLOR: '#e0e0e0',                            // Light gray for base elements
    BASE_STROKE_COLOR: '#808080',                     // Medium gray for borders
    SECONDARY_BACKGROUND_COLOR: '#ffffff',            // Pure white for maximum contrast
    TEXT_COLOR: '#000000',                            // Pure black for maximum legibility
    VALUE_TEXT_COLOR: 'rgba(60,60,60,0.9)',           // Dark gray for values
    OTHER_TEXT_COLOR: 'rgba(30,30,30,0.9)',           // Very dark gray for secondary text
    INSTANCE_COLOR: '#000000',                        // Pure black for maximum visibility
    DISTRIBUTION_COLOR: '#d0d0d0',                    // Light gray for distributions
    DISTRIBUTION_STROKE_COLOR: '#707070',             // Dark gray for borders
    CATEGORICAL_INSTANCE_COLOR: '#a0a0a0',            // Medium gray for categories
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#505050',     // Dark gray for category borders
    FI_POSITIVE_COLOR: '#535353',                     // Very dark gray for positive FI
    NEGATIVE_FI_COLOR: '#202020',                     // Almost black for negative FI
    GRID_COLOR: '#000000',                            // Pure black for well-defined grid
  },
};
