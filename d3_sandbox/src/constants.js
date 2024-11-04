const d3 = require('d3');


export const SINGLE_FEATURE_HEIGHT = 30;
export const FI_COLUMN_WIDTH = 75;
export const RULES_COLUMN_WIDTH = 300;
export const LABELS_COLUMN_WIDTH = 250;
export const CRULES_GRID_COLUMN_WIDTH = 20;
export const GUTTER = 10;
export const VERTICAL_GUTTER = 5;
export const MENU_HEIGHT = SINGLE_FEATURE_HEIGHT * 3;
export const FONT_SIZE = 11;

export const GLOBAL_WIDTH = 700;
export const dispatcher = d3.dispatch('changeCounterRule', 'changeOrder', 'changeFilter', 'changePalette');


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
    BACKGROUND_COLOR: '#3a3a3a', // Dark gray for background
    CRULES_COLOR: 'rgba(158,79,103,1)',
    CRULES_STROKE_COLOR: 'rgba(133,66,86,1)',
    RULE_COLOR: 'rgba(230,174,85,1)',
    RULE_STROKE_COLOR: darkenColor('#E6AE55B3', 1),
    BASE_COLOR: '#dcc',
    BASE_STROKE_COLOR: '#4e4e4e', // Darker stroke color for base
    SECONDARY_BACKGROUND_COLOR: '#2a2a2a', // Slightly lighter background for secondary elements
    TEXT_COLOR: '#ffffff', // White text for high contrast
    VALUE_TEXT_COLOR: '#d1d1d1', // Light gray for value text
    OTHER_TEXT_COLOR: '#b0b0b0', // Gray for other text
    INSTANCE_COLOR: '#ff6f61', // Bright color for instances
    DISTRIBUTION_COLOR: '#4d4d4d', // Dark color for distributions
    DISTRIBUTION_STROKE_COLOR: '#808080', // Darker stroke color for distributions
    CATEGORICAL_INSTANCE_COLOR: '#b0b0b0', // Dark gray for categorical instances
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#d1d1d1', // Darker stroke color for categorical instances
    FI_POSITIVE_COLOR: '#37995e', // Green for positive feature importance
    NEGATIVE_FI_COLOR: '#d1804d', // Red for negative feature importance
    GRID_COLOR: '#b0b0b0', // Dark color for grid lines
  },
  grayscaleHighContrast: {
    BACKGROUND_COLOR: '#f8f8f8', // Grigio molto chiaro per un leggero contrasto con il bianco
    CRULES_COLOR: 'rgba(80,80,80,1)', // Grigio scuro per un buon contrasto
    CRULES_STROKE_COLOR: 'rgba(50,50,50,1)', // Ancora più scuro per il contorno
    RULE_COLOR: 'rgba(150,150,150,1)', // Grigio medio per differenziare dagli altri elementi
    RULE_STROKE_COLOR: 'rgba(100,100,100,1)', // Grigio più scuro per evidenziare i bordi
    BASE_COLOR: '#e0e0e0', // Grigio chiaro per le aree di sfondo
    BASE_STROKE_COLOR: '#808080', // Grigio medio per bordi e contorni
    SECONDARY_BACKGROUND_COLOR: '#ffffff', // Bianco puro per il massimo contrasto con il testo
    TEXT_COLOR: '#000000', // Nero puro per il massimo contrasto e leggibilità
    VALUE_TEXT_COLOR: 'rgba(60,60,60,0.9)', // Grigio scuro per valori, mantenendo un contrasto elevato
    OTHER_TEXT_COLOR: 'rgba(30,30,30,0.9)', // Ancora più scuro per differenziare il testo secondario
    INSTANCE_COLOR: '#000000', // Nero puro per la massima visibilità
    DISTRIBUTION_COLOR: '#d0d0d0', // Grigio chiaro per evidenziare le distribuzioni
    DISTRIBUTION_STROKE_COLOR: '#707070', // Grigio scuro per i contorni
    CATEGORICAL_INSTANCE_COLOR: '#a0a0a0', // Grigio medio per le categorie
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#505050', // Grigio scuro per i bordi delle categorie
    FI_POSITIVE_COLOR: '#404040', // Grigio molto scuro per i valori positivi
    NEGATIVE_FI_COLOR: '#202020', // Grigio quasi nero per i valori negativi
    GRID_COLOR: '#000000', // Nero puro per una griglia ben definita
  },
};
