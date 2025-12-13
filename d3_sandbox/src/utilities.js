/**
 * utilities.js - Utility functions for text processing and layout management
 * 
 * This file provides helper functions for:
 * - Text formatting and wrapping for SVG display
 * - Converting predicates to human-readable text
 * - Managing column layouts in the visualization
 */

const d3 = require('d3');
const { GUTTER, LABELS_COLUMN_WIDTH, RULES_COLUMN_WIDTH, FI_COLUMN_WIDTH } = require('./constants');

/**
 * Find all occurrences of a search string within a text
 * 
 * @param {string} text - The text to search in
 * @param {string} search - The string to search for
 * @returns {number[]} Array of indices where the search string was found
 */
function allOccurences(text, search) {
  const indexes = [];
  let i = -1;
  i = text.indexOf(search, i + 1);
  while (i !== -1) {
    indexes.push(i);
    i = text.indexOf(search, i + 1);
  }
  return indexes;
}

/**
 * Process text into lines that fit within a specified width
 * 
 * Breaks text into multiple lines based on word boundaries to ensure
 * each line doesn't exceed the specified character width.
 * Ignores formatting markers (_* and *_) when calculating length.
 * 
 * @param {string} text - The text to process
 * @param {number} width - Maximum character width per line
 * @returns {string[]} Array of text lines
 */
function processLines(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = `${currentLine} ${word}`;
    // Calculate length without formatting markers
    const testLength = testLine.replace(/_\*|\*_/g, '').length;
    if (testLength > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);

  return lines;
}

/**
 * Convert text to SVG tspan elements with formatting
 * 
 * Transforms markdown-like text with _*bold markers*_ into SVG tspan elements,
 * wrapping text to fit within specified width and handling bold formatting.
 * Text between _* and *_ markers is rendered with font-weight 500.
 * 
 * @param {string} text - The text to convert (may contain _* *_ markers)
 * @param {number} width - Maximum character width per line
 * @param {number} x - X-coordinate for tspan positioning (default: 0)
 * @returns {string} SVG tspan elements as HTML string
 * 
 * @example
 * text2tspan("This is _*bold*_ text", 50, 0)
 * // Returns: <tspan x="0" dy="0">This is <tspan font-weight="500">bold</tspan> text</tspan>
 */
function text2tspan(text, width, x = 0) {
  const lines = processLines(text, width);

  // Format each line with bold markers
  const formatLines = lines.map((l) => {
    let cl = l;
    // Find all bold marker positions
    let startIndexes = allOccurences(cl, '_*');
    let endIndexes = allOccurences(cl, '*_');

    // Balance markers if mismatched
    if (startIndexes.length > endIndexes.length) {
      cl = `${l}*_`;
    }

    if (startIndexes.length < endIndexes.length) {
      cl = `_*${l}`;
    }
    startIndexes = allOccurences(cl, '_*');
    endIndexes = allOccurences(cl, '*_');

    // Replace markers with tspan tags when balanced
    if (startIndexes.length === endIndexes.length) {
      const l2 = cl.split('');
      startIndexes.forEach((s, i) => {
        l2[s + 1] = '';
        l2[s] = '<tspan font-weight="500">';
        l2[endIndexes[i]] = '</tspan>';
        l2[endIndexes[i] + 1] = '';
      });
      return l2.join('');
    }

    return l;
  });

  // Wrap each line in a tspan with appropriate spacing
  return formatLines.map((line, i) => `<tspan x="${x}" dy="${i ? '1.2em' : 0}" >${line}</tspan>`).join('');
}

/**
 * Convert text to HTML with formatting
 * 
 * Similar to text2tspan but outputs HTML div elements instead of SVG tspan.
 * Useful for tooltips and HTML-based displays.
 * Text between _* and *_ markers is rendered with <b> tags.
 * 
 * @param {string} text - The text to convert (may contain _* *_ markers)
 * @param {number} width - Maximum character width per line
 * @returns {string} HTML div elements as string
 * 
 * @example
 * text2html("This is _*bold*_ text", 50)
 * // Returns: <div>This is <b>bold</b> text</div>
 */
function text2html(text, width) {
  const lines = processLines(text, width);
  
  // Format each line with bold markers
  const formatLines = lines.map((l) => {
    let cl = l;
    // Find all bold marker positions
    let startIndexes = allOccurences(cl, '_*');
    let endIndexes = allOccurences(cl, '*_');

    // Balance markers if mismatched
    if (startIndexes.length > endIndexes.length) {
      cl = `${l}*_`;
    }

    if (startIndexes.length < endIndexes.length) {
      cl = `_*${l}`;
    }
    startIndexes = allOccurences(cl, '_*');
    endIndexes = allOccurences(cl, '*_');

    // Replace markers with <b> tags when balanced
    if (startIndexes.length === endIndexes.length) {
      const l2 = cl.split('');
      startIndexes.forEach((s, i) => {
        l2[s + 1] = '';
        l2[s] = '<b>';
        l2[endIndexes[i]] = '</b>';
        l2[endIndexes[i] + 1] = '';
      });
      return l2.join('');
    }

    return l;
  });
  
  // Wrap each line in a div element
  return formatLines.map(line => `<div>${line}</div>`).join('');
}


/**
 * Convert rule predicates to human-readable text explanation
 * 
 * Generates natural language descriptions of rules and counter-rules
 * for both numerical and categorical features. Handles positive and
 * negative predicates (what should/shouldn't be true).
 * 
 * @param {Array} adjmatrix - Adjacency matrix for categorical features (null for numeric)
 * @param {Array} values - Array of feature values with their predicates
 * @param {string} ruleSelector - Which rule to explain (e.g., 'R0', 'C0')
 * @param {string} prefix - Optional prefix text for the explanation
 * @returns {string} Human-readable explanation with formatting markers
 * 
 * @example
 * // For numeric feature: "To obtain class 1, this feature should have a value between 5.00 and 10.00"
 * // For categorical: "To obtain class 1, the feature should have value 'high'"
 */
function predicate2text(adjmatrix, values, ruleSelector, prefix = '') {
  const format = d3.format('.2f');
  
  // Handle numerical features (no adjacency matrix)
  if (!adjmatrix) {
    const fPredicate = values[0].predicates[ruleSelector];
    if (fPredicate.length >= 1) {
      return `${prefix} To obtain class _*${fPredicate[0].consequent_class}*_, this feature _*should have*_ a value between _*${format(fPredicate[0].interval[0])} and ${format(fPredicate[0].interval[1])}*_`;
    }
  } else {
    // Handle categorical features (with adjacency matrix)
    const vPredicates = values.map(v => ({
      preds: v.predicates[ruleSelector], rname: v.rname, cvalue: v.eda.category,
    }));
    // Separate positive (exp_value=1) and negative (exp_value=0) predicates
    const vpPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 1);
    const vnPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 0);

    // Single positive predicate
    if (vpPredicates.length === 1) {
      return `${prefix} To obtain class _*${vpPredicates[0].preds.consequent_class}*_, the feature _*should have*_ value _*${vpPredicates[0].cvalue}*_`;
    }
    
    const negativePredicates = vnPredicates.length;
    if (negativePredicates === 0) {
      return 'Mha!!!';  // No predicates found
    }
    
    // Single negative predicate
    if (negativePredicates === 1) {
      return `${prefix} To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should NOT have*_ the value _*${vnPredicates[0].cvalue}*_`;
    }

    // Multiple positive predicates
    return `${prefix} To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should have*_ the values _*${vpPredicates.map(v => v.cvalue).join(', ')}*_`;
  }
  return '';
}

/**
 * ColumnLayout - Manages the layout and positioning of visualization columns
 * 
 * Provides a flexible system for managing multiple columns in the visualization,
 * automatically calculating positions based on widths and spacing.
 * 
 * @constructor
 * @returns {Object} ColumnLayout instance with methods for managing columns
 */
function ColumnLayout() {
  // Array storing column configurations
  const columns = [];

  // Map from column names to their indices
  const columnNames = {};

  // Horizontal spacing between columns
  let spacing = 10;

  function me() {
    // Constructor function
  }

  /**
   * Add a new column to the layout
   * 
   * @param {string} columnName - Unique identifier for the column
   * @param {number} width - Width of the column in pixels
   * @returns {Object} The ColumnLayout instance for method chaining
   */
  me.addColumn = function (columnName, width) {
    const newColumn = {
      width,
      x: 0,
      name: columnName,
    };
    // Calculate x position based on previous columns
    if (columns.length > 0) {
      newColumn.x = columns[columns.length - 1].x + columns[columns.length - 1].width + spacing;
    } else {
      newColumn.x = spacing;
    }
    columns.push(newColumn);
    columnNames[columnName] = columns.length - 1;

    return me;
  };

  /**
   * Get or set the spacing between columns
   * 
   * @param {number} _ - New spacing value (optional)
   * @returns {number|Object} Current spacing or ColumnLayout instance
   */
  me.spacing = function (_) {
    if (!arguments.length) return spacing;
    spacing = _;
    return me;
  };

  /**
   * Get the dimensions and position of a column
   * 
   * @param {string} columnName - Name of the column
   * @returns {Object|null} Object with {name, width, x} or null if not found
   */
  me.dimensions = function (columnName) {
    if (columnName in columnNames) {
      return columns[columnNames[columnName]];
    }
    return null;
  };

  /**
   * Update the width of a column and recalculate positions
   * 
   * When a column width changes, all subsequent columns are repositioned
   * to maintain proper spacing.
   * 
   * @param {string} columnName - Name of the column to resize
   * @param {number} width - New width in pixels
   * @returns {Object} The ColumnLayout instance for method chaining
   */
  me.setWidth = function (columnName, width) {
    if (columnName in columnNames) {
      columns[columnNames[columnName]].width = width;
      // Recalculate positions for all subsequent columns
      for (let i = columnNames[columnName] + 1; i < columns.length; i += 1) {
        columns[i].x = columns[i - 1].x + columns[i - 1].width + spacing;
      }
    }
    return me;
  };

  return me;
}

// ============================================
// GLOBAL COLUMN LAYOUT CONFIGURATION
// ============================================

/**
 * Global column layout instance defining the structure of the visualization
 * 
 * Columns from left to right:
 * 1. feature-handler: Expand/collapse controls (20px)
 * 2. feature-labels: Feature names and values (LABELS_COLUMN_WIDTH)
 * 3. feature-values: Distribution and rules display (RULES_COLUMN_WIDTH)
 * 4. crule-grid: Counter-rules grid (10px base, expands with number of rules)
 * 5. feature-importance: Feature importance bars (FI_COLUMN_WIDTH)
 */
const columnLayout = ColumnLayout();
columnLayout.spacing(GUTTER);
columnLayout.addColumn('feature-handler', 20);
columnLayout.addColumn('feature-labels', LABELS_COLUMN_WIDTH);
columnLayout.addColumn('feature-values', RULES_COLUMN_WIDTH);
columnLayout.addColumn('crule-grid', 10);
columnLayout.addColumn('feature-importance', FI_COLUMN_WIDTH);


module.exports = {
  text2tspan, predicate2text, text2html, columnLayout,
};
