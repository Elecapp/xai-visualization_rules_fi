// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const SINGLE_FEATURE_HEIGHT = 25;
const FIRST_COLUMN_WIDTH = 100;
const SECOND_COLUMN_WIDTH = 300;

function FIPERFeatureValuesView() {
  let width = SECOND_COLUMN_WIDTH;
  let height = 50;
  const barLength = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1]);

  function me(selection) {
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('x', 0)
      .attr('y', SINGLE_FEATURE_HEIGHT / 4)
      .attr('width', barLength(1))
      .attr('height', SINGLE_FEATURE_HEIGHT * 2 / 3)
      .attr('fill', 'lightgray');
    return me;
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    barLength.range([0, width]);
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
      .attr('stroke', 'black')
      .attr('stroke-width', 0.3);
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('x', (width / 2))
      .attr('y', SINGLE_FEATURE_HEIGHT / 4)
      .attr('width', d => barLength(Math.abs(d.feature_importance)))
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', d => (d.feature_importance < 0 ? 'red' : 'blue'));
    selection.selectAll('rect')
      .filter(d => d.feature_importance < 0)
      .attr('x', d => (width / 2) - barLength(Math.abs(d.feature_importance)));
    selection.append('text')
      .attr('x', width + 350)
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('dy', '0.35em')
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
    const fiMax = d3.max(features, d => Math.abs(d.feature_importance));
    const fiExtent = [0, fiMax];
    const ffv = FIPERFeatureImportanceView()
      .width(FIRST_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .fitExtent(fiExtent);
    const fvv = FIPERFeatureValuesView()
      .width(SECOND_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);

    yScale.domain([0, features.length])
      .range([0, height]);
    const gFeatures = selection.selectAll('g')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i)})`);
    gFeatures.each((_, j, n) => {
      d3.select(n[j])
        .append('g')
        .classed('feature-importance', true)
        .call(ffv);
      d3.select(n[j])
        .append('g')
        .classed('feature-values', true)
        .attr('transform', `translate(${FIRST_COLUMN_WIDTH}, 0)`)
        .call(fvv);
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
  const height = rEntries.length * SINGLE_FEATURE_HEIGHT;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', 500)
    .attr('height', height);

  const fv = FIPERView().width(500).height(height);
  svg.datum(rEntries).call(fv);
});
