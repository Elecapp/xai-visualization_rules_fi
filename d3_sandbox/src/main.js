// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

function FIPERFeatureView() {
  let width = 500;
  let height = 500;

  function me(selection) {
    const feature = selection.datum();
    console.log(feature);
    selection.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', 'red');
    selection.append('text')
      .text(d => d[0]);
  }

  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  return me;
}

function FIPERView() {
  let width = 500;
  let height = 500;
  const yScale = d3.scaleLinear();
  function me(selection) {
    // console.log(selection.datum());
    const features = selection.datum();
    const ffv = FIPERFeatureView().width(width).height(height);
    yScale.domain([0, features.length])
      .range([0, height]);
    const gFeatures = selection.selectAll('g')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i)})`);
    gFeatures.call(ffv);
  }

  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  return me;
}


d3.json('/static/instance_34.json').then((data) => {
  const rFeatures = d3.group(data.features, d => d.rname);
  const rEntries = Array.from(rFeatures.entries());
  const height = rEntries.length * 45;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', 500)
    .attr('height', height);

  const fv = FIPERView().width(500).height(height);
  svg.datum(rEntries).call(fv);
});
