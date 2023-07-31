// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const SINGLE_FEATURE_HEIGHT = 30;
const FI_COLUMN_WIDTH = 100;
const RULES_COLUMN_WIDTH = 300;
const LABELS_COLUMN_WIDTH = 250;
const GUTTER = 10;

// create a dict for a color template
const FT_Template = {
  MAIN_COLOR: '#9e2f50',
  SECOND_COLOR: '#45578D',
  THIRD_COLOR: '#f2c14e',
  BASE_COLOR: '#dcc',
  BACKGROUND_COLOR: '#fff1e0',
  SECONDARY_BACKGROUND_COLOR: '#fdfdfd',
  TEXT_COLOR: '#000',
  STROKE_COLOR: '#000',
  DISTRIBUTION_COLOR: 'grey',
};

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
      rule: d.rule,
      crules: d.crules,
    };
  }).filter(d => d.value > 0);
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
      selection.selectAll('rect.instance-value')
        .data(d => prepareCategoricalValues(d.values).filter(v => v.instance_value > 0))
        .join('rect')
        .classed('instance-value', true)
        .attr('x', d => barLength(d.cumulative) + (barLength(d.value) / 2) - 2)
        .attr('y', SINGLE_FEATURE_HEIGHT / 3)
        .attr('width', 2)
        .attr('height', (SINGLE_FEATURE_HEIGHT / 3))
        .attr('fill', FT_Template.STROKE_COLOR);
    } else {
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      selection.selectAll('rect.instance-value')
        .data(d => d.values)
        .join('rect')
        .classed('instance-value', true)
        .attr('x', d => (barLength(d.instance_value) - 2))
        .attr('y', SINGLE_FEATURE_HEIGHT / 3)
        .attr('width', 2)
        .attr('height', (SINGLE_FEATURE_HEIGHT * 2 / 3))
        .attr('fill', FT_Template.STROKE_COLOR);
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

function FIPERNumericDistributionBoxPlotView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 50;
  let xScale = d3.scaleLinear();

  function prepareNumericalValues(data) {
    const eda = data[0].eda;
    const newdata = [];
    newdata.push({
      value0: eda.min,
      value1: eda.q1,
      y0: 0,
      y1: 0.1,
      type: 'line',
    });
    newdata.push({
      value0: eda.q1,
      value1: eda.median,
      y0: 0.1,
      y1: 1,
      type: 'box',
    });
    newdata.push({
      value0: eda.median,
      value1: eda.q3,
      y0: 1,
      y1: 0.1,
      type: 'box',
    });
    newdata.push({
      value0: eda.q3,
      value1: eda.max,
      y0: 0.1,
      y1: 0,
      type: 'line',
    });
    return newdata;
  }

  function me(selection) {
    selection.selectAll('rect')
      .data(d => prepareNumericalValues(d.values).filter(d => d.type === 'box'))
      .join('rect')
      .attr('x', d => xScale(d.value0))
      .attr('y', SINGLE_FEATURE_HEIGHT / 6)
      .attr('width', d => xScale(d.value1) - xScale(d.value0))
      .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
      .attr('fill', FT_Template.DISTRIBUTION_COLOR)
      .attr('fill-opacity', 0.2)
      .attr('stroke', FT_Template.DISTRIBUTION_COLOR);
    selection.selectAll('line')
      .data(d => prepareNumericalValues(d.values).filter(d => d.type === 'line'))
      .join('line')
      .attr('x1', d => xScale(d.value0))
      .attr('x2', d => xScale(d.value1))
      .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
      .attr('stroke', FT_Template.DISTRIBUTION_COLOR)
      .attr('stroke-width', 1.3);

    return me;
  }

  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    xScale.range([0, width]);
    return me;
  };

  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  me.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
    return me;
  };

  return me;
}

function FIPERNumericDistributionLineChartView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 50;
  let color = FT_Template.DISTRIBUTION_COLOR;
  let xScale = d3.scaleLinear();
  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([1 * SINGLE_FEATURE_HEIGHT, 0]);
  const line = d3.line()
    .x(d => xScale(d.value1))
    .y(d => yScale(d.y1))
    .curve(d3.curveBasis);

  function prepareNumericalValues(data) {
    const eda = data[0].eda;
    const yValues = [0, 0.1, 1.0, 0.1, 0];
    const newdata = ['min', 'q1', 'median', 'q3', 'max']
      .map((d, i) => ({
        value1: eda[d],
        y1: yValues[i],
      }));

    return newdata;
  }

  function me(selection) {
    selection.selectAll('path.single-linechart-value')
      .data(d => [prepareNumericalValues(d.values)])
      .join('path')
      .classed('single-linechart-value', true)
      .attr('d', d => line(d))
      .attr('fill', color)
      .attr('fill-opacity', 0.2)
      .attr('stroke', color);

    return me;
  }

  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    xScale.range([0, width]);
    return me;
  };

  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  me.xScale = function (_) {
    if (!arguments.length) return xScale;
    xScale = _;
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
  let color = FT_Template.DISTRIBUTION_COLOR;
  let fFilterRule = d => d.rule.length;

  function me(selection) {
    const gDetails = selection.selectAll('g.details')
      .data(d => [d])
      .join('g')
      .classed('details', true)
      .attr('transform', `translate(0, ${1.5 * SINGLE_FEATURE_HEIGHT})`)
      .attr('visibility', d => (d.status === 1 ? 'visible' : 'hidden'));

    if (selection.datum().type === 'categorical') {
      const total = d3.sum(selection.datum().values, d => d.eda.count);
      barLength.domain([0, total]);

      const gSingleBar = selection.selectAll('g.single-bar')
        .data(d => [d])
        .join('g')
        .classed('single-bar', true);

      gSingleBar.selectAll('rect.single-bar')
        .data(d => prepareCategoricalValues(d.values).filter(fFilterRule))
        .join('rect')
        .classed('single-bar', true)
        .attr('x', d => barLength(d.cumulative))
        .attr('y', SINGLE_FEATURE_HEIGHT / 6)
        .attr('width', d => barLength(d.value))
        .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
        .attr('fill', color)
        .attr('fill-opacity', 0.2)
        .attr('stroke', color);

      if (selection.datum().status === 1) {
        gDetails.selectAll('rect.single-bar')
          .data(d => prepareCategoricalValues(d.values))
          .join('rect')
          .classed('single-bar', true)
          .attr('x', 0)
          .attr('y', (d, i) => (i * SINGLE_FEATURE_HEIGHT) + (SINGLE_FEATURE_HEIGHT / 4))
          .attr('width', d => barLength(d.value))
          .attr('height', (SINGLE_FEATURE_HEIGHT / 2))
          .attr('fill', color)
          .attr('fill-opacity', d => (d.instance_value ? 0.5 : 0.2))
          .attr('stroke', color);
        gDetails.selectAll('text.single-bar')
          .data(d => prepareCategoricalValues(d.values))
          .join('text')
          .classed('single-bar', true)
          .attr('x', -GUTTER)
          .attr('y', (d, i) => (i * SINGLE_FEATURE_HEIGHT) + (SINGLE_FEATURE_HEIGHT / 2))
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .attr('font-size', 12)
          .text(d => `${d.label}`);
        gDetails.selectAll('text.single-bar-value')
          .data(d => prepareCategoricalValues(d.values))
          .join('text')
          .classed('single-bar-value', true)
          .attr('x', d => barLength(d.value) + GUTTER)
          .attr('y', (d, i) => (i * SINGLE_FEATURE_HEIGHT) + (SINGLE_FEATURE_HEIGHT / 2))
          .attr('text-anchor', 'start')
          .attr('alignment-baseline', 'middle')
          .attr('font-size', 12)
          .text(d => `${d.value} (${d.percent.toFixed(2)}%)`);
      }
    } else {
      // Here we have a numerical feature
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      const ndbpv = FIPERNumericDistributionLineChartView()
        .xScale(barLength)
        .width(width)
        .height(SINGLE_FEATURE_HEIGHT)
        .color(color);
      selection.call(ndbpv);

      if (selection.datum().status === 1) {
        const fndlcv = FIPERNumericDistributionBoxPlotView()
          .xScale(barLength)
          .width(width)
          .height(SINGLE_FEATURE_HEIGHT);
        gDetails.call(fndlcv);
      }
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

  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  me.fFilterRule = function (_) {
    if (!arguments.length) return fFilterRule;
    fFilterRule = _;
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
      .text(d => `${d.rname}`);
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
      .attr('fill', d => (d.feature_importance < 0 ? FT_Template.DISTRIBUTION_COLOR : FT_Template.SECOND_COLOR));
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
      .height(SINGLE_FEATURE_HEIGHT)
      .color(FT_Template.DISTRIBUTION_COLOR)
      .fFilterRule(() => true);

    const rule_fdv = FIPERFeatureDistributionView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .color(FT_Template.THIRD_COLOR)
      .fFilterRule(d => d.rule.length);

    const crules_fdv = FIPERFeatureDistributionView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .color(FT_Template.MAIN_COLOR)
      .fFilterRule(d => Object.keys(d.rule).length);

    const fivv = FIPERFeatureInstanceValueView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    const flv = FIPERFeatureLabelsView()
      .width(LABELS_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    const highlightScale = d3.scaleOrdinal()
      .domain([false, true])
      .range([FT_Template.BACKGROUND_COLOR, FT_Template.SECONDARY_BACKGROUND_COLOR]);
    const backgroundHeight = d3.scaleOrdinal()
      .domain([0, 1, 2])
      .range([SINGLE_FEATURE_HEIGHT, 5 * SINGLE_FEATURE_HEIGHT, SINGLE_FEATURE_HEIGHT]);
    yScale.domain([0, features.length])
      .range([0, features.length * SINGLE_FEATURE_HEIGHT]);
    const gFeatures = selection.selectAll('g.feature')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i) + (d.status > 1 ? (d.rows + 1) * SINGLE_FEATURE_HEIGHT : 0)})`);
    gFeatures.selectAll('rect.background')
      .data(d => [d])
      .join('rect')
      .classed('background', true)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', d => (d.status === 1 ? (d.rows + 2) * SINGLE_FEATURE_HEIGHT : SINGLE_FEATURE_HEIGHT))
      .attr('fill', d => highlightScale(d.highlighted));
    gFeatures.each((_, j, n) => {
      d3.select(n[j]).selectAll('g.feature-importance')
        .data(d => [d])
        .join('g')
        .classed('feature-importance', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + RULES_COLUMN_WIDTH + (2 * GUTTER)}, 0)`)
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
      gValueStack.selectAll('g.rule')
        .data(d => [d])
        .join('g')
        .classed('rule', true)
        .call(rule_fdv);
      gValueStack.selectAll('g.crules')
        .data(d => [d])
        .join('g')
        .classed('crules', true)
        .call(crules_fdv);

      d3.select(n[j]).selectAll('g.feature-labels')
        .data(d => [d])
        .join('g')
        .classed('feature-labels', true)
        .attr('transform', 'translate(0, 0)')
        .call(flv);
    });
    gFeatures.on('click', function () {
      const currSelection = d3.select(this).datum().highlighted;
      gFeatures.data().forEach((d) => {
        // eslint-disable-next-line no-param-reassign
        d.highlighted = false;
      });
      if (!currSelection) {
        d3.select(this).datum().highlighted = true;
      }
      let selectedIdx = 9999999999;
      let rows = 1;
      gFeatures.data().forEach((d, i) => {
        if (d.highlighted) {
          selectedIdx = i;
          d.status = 1;
          rows = gFeatures.data()[selectedIdx].values.length;
          if (d.type === 'numeric') {
            rows = 5;
          }
          d.rows = rows;
        } else {
          d.status = 0;
          if (i > selectedIdx) {
            d.status = 2;
          }
        }
      });
      gFeatures.data().forEach((d, i) => {
        if (i >= selectedIdx) {
          d.rows = rows;
        }
      });
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
      status: 0,
      rows: 1,
    }));
  rEntries.sort((a, b) => (b.feature_importance) - (a.feature_importance));
  const maxValues = d3.max(rEntries, d => d.values.length);
  const height = (rEntries.length + maxValues) * SINGLE_FEATURE_HEIGHT;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', GLOBAL_WIDTH)
    .attr('height', height);

  const fv = FIPERView().width(GLOBAL_WIDTH).height(height);
  svg.datum(rEntries).call(fv);
});
