import * as d3 from 'd3';


export const SINGLE_FEATURE_HEIGHT = 30;
export const FI_COLUMN_WIDTH = 75;
export const RULES_COLUMN_WIDTH = 300;
export const LABELS_COLUMN_WIDTH = 250;
export const CRULES_GRID_COLUMN_WIDTH = 20;
export const GUTTER = 10;
export const VERTICAL_GUTTER = 5;
export const MENU_HEIGHT = SINGLE_FEATURE_HEIGHT * 5;
export const FONT_SIZE = 11;

export const GLOBAL_WIDTH = 700;
export const dispatcher = d3.dispatch('changeCounterRule',
  'changeOrder', 'changeFilter', 'changePalette', 'changeTextualFormat', 'changeProgressStep',
  'tutorialButtonClick');


// eslint-disable-next-line no-unused-vars
function darkenColor(color, amount) {
  return d3.hsl(color).darker(amount).toString();
}

// create a dict for a color template
export const colorSet = {
  default: {
    BACKGROUND_COLOR: '#f0f5f9',
    CRULES_COLOR: 'rgba(128, 90, 162, 1)',
    CRULES_STROKE_COLOR: 'rgba(106, 74, 135, 1)',
    RULE_COLOR: 'rgba(205, 133, 63, 1)',
    RULE_STROKE_COLOR: 'rgba(169, 110, 52, 1)',
    BASE_COLOR: '#b8d0eb',
    BASE_STROKE_COLOR: '#9ab0c8',
    SECONDARY_BACKGROUND_COLOR: '#f9fafc',
    TEXT_COLOR: '#2d3748',
    VALUE_TEXT_COLOR: 'rgba(72, 105, 159, 0.85)',
    OTHER_TEXT_COLOR: 'rgba(45, 55, 72, 0.8)',
    INSTANCE_COLOR: '#1a202c',
    DISTRIBUTION_COLOR: '#e2e8f0',
    DISTRIBUTION_STROKE_COLOR: '#a0aec0',
    CATEGORICAL_INSTANCE_COLOR: '#a3b8cc',
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#64748b',
    FI_POSITIVE_COLOR: '#4b7561',
    NEGATIVE_FI_COLOR: '#73584E',
    GRID_COLOR: '#2d3748',
  },
  darkModeColorPalette: {
    BACKGROUND_COLOR: '#263135',
    CRULES_COLOR: 'rgb(190,148,224)',
    CRULES_STROKE_COLOR: 'rgb(154,125,179)',
    RULE_COLOR: 'rgba(215, 155, 95, 1)',
    RULE_STROKE_COLOR: 'rgba(235, 175, 115, 1)',
    BASE_COLOR: '#3a526f',
    BASE_STROKE_COLOR: '#7d8fbc',
    SECONDARY_BACKGROUND_COLOR: '#22272e',
    TEXT_COLOR: '#e2e8f0',
    VALUE_TEXT_COLOR: 'rgba(180, 200, 230, 0.9)',
    OTHER_TEXT_COLOR: 'rgba(220, 225, 235, 0.8)',
    INSTANCE_COLOR: '#f8fafc',
    DISTRIBUTION_COLOR: '#3d4d65',
    DISTRIBUTION_STROKE_COLOR: '#5a6d8a',
    CATEGORICAL_INSTANCE_COLOR: '#4e6080',
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#7b8fb6',
    FI_POSITIVE_COLOR: '#608176',
    NEGATIVE_FI_COLOR: '#73635f',
    GRID_COLOR: '#d2d2dc',
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
    FI_POSITIVE_COLOR: '#535353', // Grigio molto scuro per i valori positivi
    NEGATIVE_FI_COLOR: '#202020', // Grigio quasi nero per i valori negativi
    GRID_COLOR: '#000000', // Nero puro per una griglia ben definita
  },
};
