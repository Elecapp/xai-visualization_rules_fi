// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import { InstanceView, preprocessData } from './fiper';
const d3 = require('d3');

const instanceView = InstanceView();

// d3.json('/static/german_explanations/instance_2.json').then((data) => {
//   const explanationDescriptor = preprocessData(data);
//   d3.select('#app').datum(explanationDescriptor).call(instanceView());
// });


d3.select('#instance')
  .on('change', () => {
    const path = d3.select('#instance').property('value');
    d3.json(path).then((data) => {
      const explanationDescriptor = preprocessData(data);
      d3.select('#app').datum(explanationDescriptor).call(instanceView);
    });
  });
