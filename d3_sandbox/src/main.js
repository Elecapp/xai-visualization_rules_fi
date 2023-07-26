// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const SINGLE_FEATURE_HEIGHT = 45;

const FIRST_COLUMN_WIDTH = 100;

function FIPERFeatureImportanceView() {
  let width = FIRST_COLUMN_WIDTH;
  let height = 50;
  let fiExtent = [0, 1];
  const barLength = d3.scaleLinear()
    .range([0, width / 2])
    .domain(fiExtent);


  /**
   * This function receives one single ```g``` element and visualizes its
   * content using the associated data.
   * @param selection the element containing a single datum with the
   *  metadata of the feature to be visualized.
   */
  function me(selection) {
    selection
      .append('line')
      .attr('x1', width / 2)
      .attr('x2', width / 2)
      .attr('y1', 0)
      .attr('y2', SINGLE_FEATURE_HEIGHT)
      .attr('stroke', 'black');
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('x', (width / 2))
      .attr('width', d => barLength(Math.abs(d.feature_importance) * (d.feature_importance < 0 ? -1 : 1)))
      .attr('height', 20)
      .attr('fill', d => (d.feature_importance < 0 ? 'red' : 'blue'));
    selection.append('text')
      .attr('x', width + 10)
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('dy', '-0.35em')
      .text(d => d.rname);
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    barLength.range([0, width / 2]);
    return me;
  };

  // eslint-disable-next-line
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  // eslint-disable-next-line
  me.fitExtent = function (_) {
    if (!arguments.length) return fiExtent;
    fiExtent = _;
    barLength.domain(fiExtent);
    return me;
  };

  return me;
}

function FIPERView() {
  let width = 500;
  let height = 500;
  const yScale = d3.scaleLinear();
  function me(selection) {
    console.log(selection.datum());
    const features = selection.datum();
    const fiExtent = d3.extent(features, d => d.feature_importance);
    const ffv = FIPERFeatureImportanceView()
      .width(FIRST_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .fitExtent(fiExtent);

    yScale.domain([0, features.length])
      .range([0, height]);
    const gFeatures = selection.selectAll('g')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i)})`);
    gFeatures.each((_, j, n) => {
      d3.select(n[j]).call(ffv);
    });
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  // eslint-disable-next-line
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  return me;
}


d3.json('/static/instance_34.json').then((data) => {
  const rFeatures = d3.group(data.features, d => d.rname);
  const rEntries = Array.from(rFeatures.entries())
    .map(d => ({
      rname: d[0],
      values: d[1],
      feature_importance: d3.sum(d[1], f => f.feature_importance),
      type: d[1][0].type,
    }));
  rEntries.sort((a, b) => (b.feature_importance) - (a.feature_importance));
  const height = rEntries.length * 45;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', 500)
    .attr('height', height);

  const fv = FIPERView().width(500).height(height);
  svg.datum(rEntries).call(fv);
});
