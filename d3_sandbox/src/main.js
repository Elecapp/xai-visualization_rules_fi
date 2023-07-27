// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const SINGLE_FEATURE_HEIGHT = 25;
const FI_COLUMN_WIDTH = 100;
const RULES_COLUMN_WIDTH = 300;
const LABELS_COLUMN_WIDTH = 200;
const GUTTER = 10;

// Format the data (instead of using d3.stack()) and
// filter out 0 values:
// extracted from: https://observablehq.com/@eesur/d3-single-stacked-bar
function prepareCategoricalValues(data) {
  const total = d3.sum(data, d => d.eda.count);

  // use a scale to get percentage values
  const percent = d3.scaleLinear()
    .domain([0, total])
    .range([0, 100]);
  // filter out data that has zero values
  // also get mapping for next placement
  // (save having to format data for d3 stack)
  let cumulative = 0;
  data.sort((a, b) => b.eda.count - a.eda.count);
  return data.map((d) => {
    cumulative += d.eda.count;
    return {
      value: d.eda.count,
      // want the cumulative to prior value (start of rect)
      cumulative: cumulative - d.eda.count,
      label: d.eda.category,
      percent: percent(d.eda.count),
      instance_value: d.instance_value,
    };
  }).filter(d => d.value > 0);
}

function prepareNumericalValues(data) {
  const eda = data[0].eda;
  const valuePoints = ['min', 'q1', 'median', 'q3', 'max'];
  const newdata = [];
  newdata.push({
    value0: eda.min,
    value1: eda.q1,
    type: 'line',
  });
  newdata.push({
    value0: eda.q1,
    value1: eda.median,
    type: 'box',
  });
  newdata.push({
    value0: eda.median,
    value1: eda.q3,
    type: 'box',
  });
  newdata.push({
    value0: eda.q3,
    value1: eda.max,
    type: 'line',
  });

  return newdata;
}

function FIPERFeatureInstanceValueView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 50;
  const barLength = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1]);

  function me(selection) {
    if (selection.datum().type === 'categorical') {
      // draw the symbol for the actual value of the instance
      const total = d3.sum(selection.datum().values, d => d.eda.count);
      barLength.domain([0, total]);
      selection.selectAll('circle')
        .data(d => prepareCategoricalValues(d.values).filter(v => v.instance_value > 0))
        .join('circle')
        .attr('cx', d => (barLength(d.cumulative) + barLength(d.value)) / 2)
        .attr('cy', SINGLE_FEATURE_HEIGHT / 2)
        .attr('r', SINGLE_FEATURE_HEIGHT / 6)
        .attr('fill', 'black');
    } else {
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      selection.selectAll('circle.instance-value')
        .data(d => d.values)
        .join('circle')
        .attr('cx', d => barLength(d.instance_value))
        .attr('cy', SINGLE_FEATURE_HEIGHT / 2)
        .attr('r', SINGLE_FEATURE_HEIGHT / 6)
        .attr('fill', 'black');
    }

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

function FIPERFeatureDistributionView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 50;
  const barLength = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1]);

  function me(selection) {
    if (selection.datum().type === 'categorical') {
      const total = d3.sum(selection.datum().values, d => d.eda.count);
      barLength.domain([0, total]);
      selection.selectAll('rect')
        .data(d => prepareCategoricalValues(d.values))
        .join('rect')
        .attr('x', d => barLength(d.cumulative))
        .attr('y', SINGLE_FEATURE_HEIGHT / 4)
        .attr('width', d => barLength(d.value))
        .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
        .attr('fill', 'lightgray')
        .attr('stroke', 'white');
    } else {
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      selection.selectAll('rect')
        .data(d => prepareNumericalValues(d.values).filter(d => d.type === 'box'))
        .join('rect')
        .attr('x', d => barLength(d.value0))
        .attr('y', SINGLE_FEATURE_HEIGHT / 4)
        .attr('width', d => barLength(d.value1) - barLength(d.value0))
        .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
        .attr('fill', 'lightgray')
        .attr('stroke', 'white');
      selection.selectAll('line')
        .data(d => prepareNumericalValues(d.values).filter(d => d.type === 'line'))
        .join('line')
        .attr('x1', d => barLength(d.value0))
        .attr('x2', d => barLength(d.value1))
        .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
        .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
        .attr('stroke', 'lightgray')
        .attr('stroke-width', 1.3);
    }

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

function FIPERFeatureLabelsView() {
  let width = FI_COLUMN_WIDTH;
  let height = 50;
  function me(selection) {
    selection.selectAll('text')
      .data(d => [d])
      .join('text')
      .attr('x', width)
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text(d => d.rname);
    return me;
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

function FIPERFeatureImportanceView() {
  let width = FI_COLUMN_WIDTH;
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
    selection.selectAll('line')
      .data(d => [d])
      .join('line')
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

const GLOBAL_WIDTH = 700;

function FIPERView() {
  let width = GLOBAL_WIDTH;
  let height = 500;
  const yScale = d3.scaleLinear();
  function me(selection) {
    console.log(selection.datum());
    const features = selection.datum();
    const fiMax = d3.max(features, d => Math.abs(d.feature_importance));
    const fiExtent = [0, fiMax];
    const ffv = FIPERFeatureImportanceView()
      .width(FI_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .fitExtent(fiExtent);
    const fdv = FIPERFeatureDistributionView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    const fivv = FIPERFeatureInstanceValueView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    const flv = FIPERFeatureLabelsView()
      .width(LABELS_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    const highlightScale = d3.scaleOrdinal()
      .domain([false, true])
      .range(['white', 'lightyellow']);
    yScale.domain([0, features.length])
      .range([0, height]);
    const gFeatures = selection.selectAll('g.feature')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i)})`);
    gFeatures.selectAll('rect.background')
      .data(d => [d])
      .join('rect')
      .classed('background', true)
      .attr('width', width)
      .attr('height', SINGLE_FEATURE_HEIGHT)
      .attr('fill', d => highlightScale(d.highlighted));
    gFeatures.each((_, j, n) => {
      d3.select(n[j]).selectAll('g.feature-importance')
        .data(d => [d])
        .join('g')
        .classed('feature-importance', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + RULES_COLUMN_WIDTH + 2 * GUTTER}, 0)`)
        .call(ffv);
      const gValueStack = d3.select(n[j]).selectAll('g.feature-values')
        .data(d => [d])
        .join('g')
        .classed('feature-values', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER}, 0)`);
      gValueStack.selectAll('g.distribution')
        .data(d => [d])
        .join('g')
        .classed('distribution', true)
        .call(fdv);
      gValueStack.selectAll('g.instance-value')
        .data(d => [d])
        .join('g')
        .classed('instance-value', true)
        .call(fivv);
      d3.select(n[j]).selectAll('g.feature-labels')
        .data(d => [d])
        .join('g')
        .classed('feature-labels', true)
        .attr('transform', 'translate(0, 0)')
        .call(flv);
    });
    gFeatures.on('click', function () {
      gFeatures.data().forEach((d) => {
        d.highlighted = false;
      });
      d3.select(this).datum().highlighted = true;
      me(selection);
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
      highlighted: false,
    }));
  rEntries.sort((a, b) => (b.feature_importance) - (a.feature_importance));
  const height = rEntries.length * SINGLE_FEATURE_HEIGHT;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', GLOBAL_WIDTH)
    .attr('height', height);

  const fv = FIPERView().width(GLOBAL_WIDTH).height(height);
  svg.datum(rEntries).call(fv);
});
