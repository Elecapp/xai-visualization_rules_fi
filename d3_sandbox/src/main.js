/**
 * main.js - Entry point for the FIPER (Feature Importance and Predicates for Explainable Rules) visualization
 * 
 * This file initializes the D3.js-based visualization interface that displays
 * explainable AI results, including feature importance, rules, and counter-rules.
 * 
 * The Vue build version to load with the `import` command
 * (runtime-only or standalone) has been set in webpack.base.conf with an alias.
 */

import { InstanceView, preprocessData } from './fiper';
const d3 = require('d3');

// Create an instance of the visualization view
const instanceView = InstanceView();

/**
 * Event handler for the instance selector dropdown
 * 
 * When the user selects a different instance from the dropdown menu,
 * this handler:
 * 1. Retrieves the selected JSON file path
 * 2. Loads the explanation data
 * 3. Preprocesses the data into the internal format
 * 4. Renders the visualization in the #app container
 */
d3.select('#instance')
  .on('change', () => {
    // Get the selected file path from the dropdown
    const path = d3.select('#instance').property('value');
    
    // Load and visualize the explanation data
    d3.json(path).then((data) => {
      // Transform raw data into the visualization format
      const explanationDescriptor = preprocessData(data);
      
      // Bind data to the DOM and render the visualization
      d3.select('#app').datum(explanationDescriptor).call(instanceView);
    });
  });
