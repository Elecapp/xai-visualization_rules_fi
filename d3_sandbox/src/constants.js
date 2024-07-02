const d3 = require('d3');

export const GLOBAL_WIDTH = 720;
export const SINGLE_FEATURE_HEIGHT = 30;
export const FI_COLUMN_WIDTH = 50;
export const RULES_COLUMN_WIDTH = 300;
export const LABELS_COLUMN_WIDTH = 250;
export const CRULES_GRID_COLUMN_WIDTH = 20;
export const GUTTER = 10;
export const VERTICAL_GUTTER = 5;
export const MENU_HEIGHT = 80;
export const FONT_SIZE = 11;
export const dispatcher = d3.dispatch('changeCounterRule');


function darkenColor(color, amount) {
  return d3.hsl(color).darker(amount).toString();
}
// create a dict for a color template
export const colorSet = {
  default: {
    BACKGROUND_COLOR: '#ffeee0',
    CRULES_COLOR: 'rgba(158,79,103,1)',
    CRULES_STROKE_COLOR: 'rgba(133,66,86,1)',
    RULE_COLOR: 'rgba(230,174,85,1)',
    RULE_STROKE_COLOR: darkenColor('#E6AE55B3', 1),
    BASE_COLOR: '#dcc',
    BASE_STROKE_COLOR: '#BFB0B0',
    SECONDARY_BACKGROUND_COLOR: '#fff8f2',
    TEXT_COLOR: '#333333',
    VALUE_TEXT_COLOR: 'rgba(133,66,86,0.8)',
    OTHER_TEXT_COLOR: 'rgba(51,51,51,0.8)',
    INSTANCE_COLOR: '#000',
    DISTRIBUTION_COLOR: '#f2e6e6',
    DISTRIBUTION_STROKE_COLOR: '#BFB0B0',
    CATEGORICAL_INSTANCE_COLOR: '#ccc2c2',
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#808080',
    FI_POSITIVE_COLOR: '#4F6A73',
    NEGATIVE_FI_COLOR: '#A27691',
    GRID_COLOR: '#000',
  },
  darkModeColorPalette: {
    BACKGROUND_COLOR: '#fff1e0',
    CRULES_COLOR: '#9e4f67',
    CRULES_STROKE_COLOR: '#854256',
    FI_POSITIVE_COLOR: '#626d8c',
    RULE_COLOR: '#f2c14e',
    RULE_STROKE_COLOR: '#d9a743',
    BASE_COLOR: '#dcc',
    BASE_STROKE_COLOR: '#BFB0B0',
    SECONDARY_BACKGROUND_COLOR: '#fdfdfd',
    TEXT_COLOR: '#333333',
    INSTANCE_COLOR: '#000',
    DISTRIBUTION_COLOR: '#dcc',
    DISTRIBUTION_STROKE_COLOR: '#BFB0B0',
    CATEGORICAL_INSTANCE_COLOR: '#B3B3B3',
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#999999',
    NEGATIVE_FI_COLOR: '#f2aaaa',
    GRID_COLOR: '#000',
  },
};
