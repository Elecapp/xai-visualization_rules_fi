// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const SINGLE_FEATURE_HEIGHT = 30;
const FI_COLUMN_WIDTH = 50;
const RULES_COLUMN_WIDTH = 300;
const LABELS_COLUMN_WIDTH = 250;
const GUTTER = 10;

// create a dict for a color template
const FTTemplate = {
  MAIN_COLOR: '#9e2f50',
  SECOND_COLOR: '#45578D',
  THIRD_COLOR: '#f2c14e',
  BASE_COLOR: '#dcc',
  BACKGROUND_COLOR: '#fff1e0',
  SECONDARY_BACKGROUND_COLOR: '#fdfdfd',
  TEXT_COLOR: '#000',
  STROKE_COLOR: '#000',
  DISTRIBUTION_COLOR: 'grey',
  CATEGORICAL_VALUE_COLOR: '#999999',
  NEGATIVE_FI_COLOR: '#f37744',
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
      crvalues: d.crvalues,
      rvalues: d.rvalues,
      name: d.name,
    };
  }).filter(d => d.value > 0);
}


function doesHold(val1, op, val2) {
  switch (op) {
    case '>':
      return val1 > val2;
    case '<':
      return val1 < val2;
    case '>=':
      return val1 >= val2;
    case '<=':
      return val1 <= val2;
    case '==':
      return val1 === val2;
    case '!=':
      return val1 !== val2;
    default:
      return false;
  }
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
        .attr('x', d => barLength(d.cumulative))
        .attr('y', SINGLE_FEATURE_HEIGHT / 6)
        .attr('width', d => barLength(d.value))
        .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
        .attr('fill', FTTemplate.CATEGORICAL_VALUE_COLOR)
        .attr('fill-opacity', 0.9)
        .attr('stroke', FTTemplate.STROKE_COLOR);
    } else {
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      selection.selectAll('rect.instance-value')
        .data(d => d.values)
        .join('rect')
        .classed('instance-value', true)
        .attr('x', d => (barLength(d.instance_value) - 2))
        .attr('y', height / 3)
        .attr('width', 2)
        .attr('height', height / 2)
        .attr('fill', FTTemplate.STROKE_COLOR);
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
      .data(d => prepareNumericalValues(d.values).filter(v => v.type === 'box'))
      .join('rect')
      .attr('x', d => xScale(d.value0))
      .attr('y', SINGLE_FEATURE_HEIGHT / 6)
      .attr('width', d => xScale(d.value1) - xScale(d.value0))
      .attr('height', (SINGLE_FEATURE_HEIGHT * 2) / 3)
      .attr('fill', FTTemplate.DISTRIBUTION_COLOR)
      .attr('fill-opacity', 0.2)
      .attr('stroke', FTTemplate.DISTRIBUTION_COLOR);
    selection.selectAll('line')
      .data(d => prepareNumericalValues(d.values).filter(v => v.type === 'line'))
      .join('line')
      .attr('x1', d => xScale(d.value0))
      .attr('x2', d => xScale(d.value1))
      .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
      .attr('stroke', FTTemplate.DISTRIBUTION_COLOR)
      .attr('stroke-width', 1.3);

    return me;
  }

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    xScale.range([0, width]);
    return me;
  };

  // eslint-disable-next-line func-names
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  // eslint-disable-next-line func-names
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
  let color = FTTemplate.DISTRIBUTION_COLOR;
  let xScale = d3.scaleLinear();
  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([(height * 2) / 3, height / 6]);
  const line = d3.line()
    .x(d => xScale(d.value1))
    .y(d => yScale(d.y1))
    .curve(d3.curveBasis);

  function prepareNumericalValues(data) {
    const eda = data[0].eda;
    const yValues = [0, 0.1, 1.0, 0.1, 0];
    return ['min', 'q1', 'median', 'q3', 'max']
      .map((d, i) => ({
        value1: eda[d],
        y1: yValues[i],
      }));
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

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    xScale.range([0, width]);
    return me;
  };

  // eslint-disable-next-line func-names
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    yScale.range([(height * 5) / 6, height / 6]);
    return me;
  };

  // eslint-disable-next-line func-names
  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  // eslint-disable-next-line func-names
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
  let color = FTTemplate.DISTRIBUTION_COLOR;
  let fFilterRule = () => true;

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
        .data(d => prepareCategoricalValues(d.values))
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
        // draw the symbol for the actual value of the instance
        gDetails.selectAll('rect.single-bar')
          .data(d => prepareCategoricalValues(d.values))
          .join('rect')
          .classed('single-bar', true)
          .attr('x', 0)
          .attr('y', (d, i) => (i * SINGLE_FEATURE_HEIGHT) + (SINGLE_FEATURE_HEIGHT / 4))
          .attr('width', d => barLength(d.value))
          .attr('height', (SINGLE_FEATURE_HEIGHT / 2))
          .attr('fill', d => (d.instance_value ? FTTemplate.CATEGORICAL_VALUE_COLOR : color))
          .attr('fill-opacity', d => (d.instance_value ? 1 : 0.2))
          .attr('stroke', d => (d.instance_value ? FTTemplate.STROKE_COLOR : color));
        // text for the labels for each value of the feature
        // TODO: constrain the text to the width of the column
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
        // text for the values for each value of the feature
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

  // eslint-disable-next-line func-names
  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.fFilterRule = function (_) {
    if (!arguments.length) return fFilterRule;
    fFilterRule = _;
    return me;
  };

  return me;
}

function FIPERRulePredicateView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 50;
  let subHeight = height / 3;
  const barLength = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1]);
  let color = FTTemplate.DISTRIBUTION_COLOR;
  let isFactualRule = true;
  let selectedCounterRule = 'C0';

  // let fFilterRule = d => (d.rule.length > 0 && d.instance_value > 0);
  let fFilterRule = v => (
    v.rvalues.length > 0 &&
      v.name === v.rvalues[0].rule[0][0].att &&
      doesHold(v.instance_value, v.rvalues[0].rule[0][0].op, v.rvalues[0].rule[0][0].thr)
  );

  function me(selection) {
    const gPredicateBar = selection.selectAll('g.single-predicate')
      .data(d => [d])
      .join('g')
      .classed('single-predicate', true);

    if (selection.datum().type === 'categorical') {
      const total = d3.sum(selection.datum().values, d => d.eda.count);
      barLength.domain([0, total]);

      const gSingleBar = gPredicateBar.selectAll('g.single-predicate-bar')
        .data(d => [d])
        .join('g')
        .classed('single-predicate-bar', true);

      gSingleBar.selectAll('rect.single-predicate-bar')
        .data(d => prepareCategoricalValues(d.values).filter(fFilterRule))
        .join('rect')
        .classed('single-predicate-bar', true)
        .attr('x', d => barLength(d.cumulative))
        .attr('width', d => barLength(d.value))
        .attr('height', height)
        .attr('fill', color)
        .attr('fill-opacity', 0.7)
        .attr('stroke', color);
    } else {
      // Here we have a numerical feature
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);

      // create a tranformation of the data to create additional fields for ranges
      // of rule predicate
      const ranges = [];
      if (isFactualRule) {
        selection.datum().values.filter(fFilterRule).forEach((rv) => {
          rv.rule.forEach((r) => {
            // r[0] contains the predicate descriptor
            // r[1] contains the predicted class of the black box model
            const pred = r[0];
            if (pred.op.indexOf('>') > -1) {
              // the predicate is greater than a threshold
              ranges.push({
                low: Math.max(pred.thr, selection.datum().values[0].eda.min),
                high: selection.datum().values[0].eda.max,
              });
            } else if (pred.op.indexOf('<') > -1) {
              // the predicate is lower than a threshold
              ranges.push({
                low: selection.datum().values[0].eda.min,
                high: Math.min(pred.thr, selection.datum().values[0].eda.max),
              });
            }
          });
        });
      } else {
        selection.datum().values.filter(fFilterRule).forEach((rv) => {
          rv.crules[selectedCounterRule].forEach((r) => {
            // r[0] contains the predicate descriptor
            // r[1] contains the predicted class of the black box model
            const pred = r[0];
            // check if it intersects the rule
            if (pred.op.indexOf('>') > -1) {
              // the predicate is greater than a threshold
              ranges.push({
                low: Math.max(pred.thr, selection.datum().values[0].eda.min),
                high: selection.datum().values[0].eda.max,
              });
            } else if (pred.op.indexOf('<') > -1) {
              // the predicate is lower than a threshold
              ranges.push({
                low: selection.datum().values[0].eda.min,
                high: Math.min(pred.thr, selection.datum().values[0].eda.max),
              });
            }
          });
        });
      }
      gPredicateBar.selectAll('rect.single-predicate-box')
        .data(ranges)
        .join('rect')
        .classed('single-predicate-box', true)
        .attr('x', d => barLength(d.low))
        .attr('y', height - subHeight)
        .attr('width', d => barLength(d.high) - barLength(d.low))
        .attr('height', subHeight)
        .attr('fill', color)
        .attr('fill-opacity', 0.7)
        .attr('stroke', color);
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

  // eslint-disable-next-line func-names
  me.subHeight = function (_) {
    if (!arguments.length) return subHeight;
    subHeight = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.isFactualRule = function (_) {
    if (!arguments.length) return isFactualRule;
    isFactualRule = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.fFilterRule = function (_) {
    if (!arguments.length) return fFilterRule;
    fFilterRule = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.selectedCounterRule = function (_) {
    if (!arguments.length) return selectedCounterRule;
    selectedCounterRule = _;
    return me;
  };

  return me;
}

function FIPERFeatureLabelsView() {
  let width = FI_COLUMN_WIDTH;
  let height = 50;
  const cLenght = d3.scaleLinear()
    .range([width, 0])
    .domain([0, 26]); // using a fixed length for labels
  function me(selection) {
    selection.selectAll('line.background')
      .data(d => [d])
      .join('line')
      .classed('background', true)
      .attr('x1', 0)
      .attr('x2', d => Math.max(cLenght(d.rname.length) - 5, 0))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .style('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.25);

    selection.selectAll('text')
      .data(d => [d])
      .join('text')
      .attr('x', width)
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 11)
      .text(d => `${d.rname}`);
    return me;
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    cLenght.range([width, 0]);
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
    .range([0, width])
    .domain(fiExtent);

  /**
   * This function receives one single ```g``` element and visualizes its
   * content using the associated data.
   * @param selection the element containing a single datum with the
   *  metadata of the feature to be visualized.
   */
  function me(selection) {
    selection.selectAll('line.background')
      .data(d => [d])
      .join('line')
      .classed('background', true)
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .style('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.25);
    selection.selectAll('line.axis')
      .data(d => [d])
      .join('line')
      .classed('axis', true)
      // .attr('x1', 0)
      // .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', SINGLE_FEATURE_HEIGHT)
      .attr('stroke', 'black')
      .attr('stroke-width', 0.3);
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      // .attr('x', (width / 2))
      .attr('y', SINGLE_FEATURE_HEIGHT / 4)
      .attr('width', d => barLength(Math.abs(d.feature_importance)))
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', d => (d.feature_importance < 0 ? FTTemplate.NEGATIVE_FI_COLOR : FTTemplate.SECOND_COLOR));
    // selection.selectAll('rect')
    //   .filter(d => d.feature_importance < 0)
    //   .attr('x', d => (width / 2) - barLength(Math.abs(d.feature_importance)));
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
  // global width of the whole visualization
  let width = GLOBAL_WIDTH;
  // global height of the whole visualization
  let height = 500;
  // scale to position each feature row. HINT: maybe a d3.scaleBand() is better?
  const yScale = d3.scaleLinear();

  function filterFalsifiedConditions(fv, cruleSelector) {
    if (cruleSelector in fv.crules) {
      const pred = doesHold(fv.instance_value, fv.crules[cruleSelector][0][0].op,
        fv.crules[cruleSelector][0][0].thr);
      console.log('fv', fv, fv.instance_value, fv.crules[cruleSelector][0][0].op,
        fv.crules[cruleSelector][0][0].thr);
      // We are interested in the Falsified predicates, so we return the negation
      return !pred;
    }
    return false;
  }

  function me(selection) {
    console.log('features', selection.datum());
    const features = selection.datum();
    // determine the maximum value of Feature Importance to fit the scale. We use absolute value
    // to ignore the sign of the feature importance
    const fiMax = d3.max(features, d => Math.abs(d.feature_importance));
    // create a scale to fit the feature importance values in absolute value
    const fiExtent = [0, fiMax];
    // Component to handle the FI visualization for each feature
    const ffv = FIPERFeatureImportanceView()
      .width(FI_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .fitExtent(fiExtent);
    // Component to handle the distribution of the values of the descriptor of each feature
    const fdv = FIPERFeatureDistributionView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT)
      .color(FTTemplate.DISTRIBUTION_COLOR)
      .fFilterRule(() => true);
    // Component to visualize the layer for the rules
    const rpv = FIPERRulePredicateView()
      .width(RULES_COLUMN_WIDTH)
      .height(2 * (SINGLE_FEATURE_HEIGHT / 3))
      .subHeight(SINGLE_FEATURE_HEIGHT / 6)
      .color(FTTemplate.THIRD_COLOR)
      .isFactualRule(true);
    // Component to visualize the layer for the counter rules
    const CounterRuleId = 'C1'; // TODO: to make it dynamic
    const crpv = FIPERRulePredicateView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT / 6)
      .subHeight(SINGLE_FEATURE_HEIGHT / 6)
      .color(FTTemplate.MAIN_COLOR)
      .isFactualRule(false)
      .selectedCounterRule(CounterRuleId)
      .fFilterRule(f => filterFalsifiedConditions(f, CounterRuleId));
    // Component to visualize the instance value for each row.
    const fivv = FIPERFeatureInstanceValueView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    // Component to visualize the labels of the features at the beginning of each row
    const flv = FIPERFeatureLabelsView()
      .width(LABELS_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    // colorscale to be used to highlight the selected feature
    const highlightScale = d3.scaleOrdinal()
      .domain([false, true])
      .range(['transparent', FTTemplate.SECONDARY_BACKGROUND_COLOR]);

    // const backgroundHeight = d3.scaleOrdinal()
    //   .domain([0, 1, 2])
    //   .range([SINGLE_FEATURE_HEIGHT, 5 * SINGLE_FEATURE_HEIGHT, SINGLE_FEATURE_HEIGHT]);
    yScale.domain([0, features.length])
      .range([0, features.length * SINGLE_FEATURE_HEIGHT]);
    const gFeatures = selection.selectAll('g.feature')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i) + (d.status > 1 ? (d.rows + 1) * SINGLE_FEATURE_HEIGHT : 0)})`);
    // a rectangle to set the widht and height of the feature row.
    gFeatures.selectAll('rect.background')
      .data(d => [d])
      .join('rect')
      .classed('background', true)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', d => (d.status === 1 ? (d.rows + 2) * SINGLE_FEATURE_HEIGHT : SINGLE_FEATURE_HEIGHT))
      .attr('fill', d => highlightScale(d.highlighted));

    // for each feature row, we have 3 groups:
    // 1. the feature importance
    // 2. the distribution of the values
    // 3. the labels
    // We call separate components to handle each group. Each groups is located accordingly
    // to the size of the corresponsing COLUMN.
    gFeatures.each((_, j, n) => {
      const gFeatureImportance = d3.select(n[j]).selectAll('g.feature-importance')
        .data(d => [d])
        .join('g')
        .classed('feature-importance', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER}, 0)`);
      gFeatureImportance.call(ffv);
      const gValueStack = d3.select(n[j]).selectAll('g.feature-values')
        .data(d => [d])
        .join('g')
        .classed('feature-values', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + FI_COLUMN_WIDTH + (2 * GUTTER)}, 0)`);
      gValueStack.selectAll('g.distribution')
        .data(d => [d])
        .join('g')
        .classed('distribution', true)
        .call(fdv);

      gValueStack.selectAll('g.rule')
        .data(d => [d])
        .join('g')
        .classed('rule', true)
        .attr('transform', `translate(0, ${SINGLE_FEATURE_HEIGHT / 6})`)
        .call(rpv);
      gValueStack.selectAll('g.crules')
        .data(d => [d])
        .join('g')
        .classed('crules', true)
        .attr('transform', `translate(0, ${(2 * SINGLE_FEATURE_HEIGHT) / 3})`)
        .call(crpv);
      gValueStack.selectAll('g.instance-value')
        .data(d => [d])
        .join('g')
        .classed('instance-value', true)
        .call(fivv);

      const gLabels = d3.select(n[j]).selectAll('g.feature-labels')
        .data(d => [d])
        .join('g')
        .classed('feature-labels', true)
        .attr('transform', 'translate(0, 0)');
      gLabels.call(flv);
    });
    // eslint-disable-next-line func-names
    gFeatures.on('click', function () {
      // mark the current selection as highlighted
      const currSelection = d3.select(this).datum().highlighted;
      // reset all the other selections
      gFeatures.data().forEach((d) => {
        // eslint-disable-next-line no-param-reassign
        d.highlighted = false;
      });
      // toggle the current selection (if it was selected, the selection is removed)
      if (!currSelection) {
        d3.select(this).datum().highlighted = true;
      }
      // search for the index of the selected element. All previous elements will be
      // marked with a 0, the selected element with a 1 and the following elements with a 2
      let selectedIdx = 9999999999;
      // rows is the number of rows that the current selection will occupy. For categorical
      // features, this is the number of distinct values. For numerical features, this is set to 5.
      let rows = 1;
      const prevFeatures = gFeatures.data();
      const newFeatures = prevFeatures.map((d, i) => {
        const current = { ...d };
        if (d.highlighted) {
          selectedIdx = i;
          current.status = 1;
          // categorical features have a different number of rows, depending on the number
          // of distinct values
          rows = prevFeatures[selectedIdx].values.length;
          if (d.type === 'numeric') {
            // for numerical features, we want to show the distribution of the values
            // in the instance. This is why we set the number of rows to 5.
            rows = 2;
          }
          current.rows = rows;
        } else {
          current.status = 0;
          if (i > selectedIdx) {
            current.status = 2;
          }
        }
        return current;
      }).map((d, i) => {
        if (i >= selectedIdx) {
          return {
            ...d,
            rows,
          };
        }
        return d;
      });
      selection.datum(newFeatures);
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

function computeBooleanExpectedValue(value) {
  // Given a dictionary like following, return an expected boolean value for it
  // {
  //     "att": "present_emp_since=.. >= 7 years",
  //     "op": "<=",
  //     "thr": 0.6689819991588593,
  //     "is_continuous": true,
  //     "exp_value": 15
  // }
  if (value.op === '<=') {
    return !(value.thr >= 0);
  }
  if (value.op === '<') {
    return !(value.thr > 0);
  }
  if (value.op === '>=') {
    return (value.thr <= 1);
  }
  if (value.op === '>') {
    return (value.thr < 1);
  }

  return false;
}

function adjustCounterRuleMatrix(matrix) {
  // For a feature we take the matrix of the form:
  // crmatrix:
  //   Array(4)
  //     0 : (5) [ 0, 0, -1, -1, -1]
  //     1 : (5) [-1, 0, -1, -1, -1]
  //     2 : (5) [-1, 0, -1, -1, -1]
  //     3 : (5) [-1, 0, -1, -1, -1]
  // and we adjust the values to have only 0 or 1. The approach is the following:
  // 1. If the maximum value of the matrix is 0, then all the -1 are changed to 1
  // 2. If the maximum value of the matrix is 1, then all the -1 are changed to 0
  // 3. If the maximum value of the matrix is -1, then we do nothing
  const max = d3.max(matrix.flat());
  if (max === 0) {
    return matrix.map(r => r.map(d => (d === -1 ? 1 : d)));
  }
  if (max === 1) {
    return matrix.map(r => r.map(d => (d === -1 ? 0 : d)));
  }
  return matrix;
}

d3.json('/static/instance_180.json').then((data) => {
  console.log('data', data);
  // preprocess each entry to copmute the expected value for the categorical counterrules
  const tfeature = data.features
    // .filter(f => f.type === 'categorical')
    // .filter(f => Object.entries(f.crules).length)
    .map((f) => {
      if (f.type === 'categorical') {
        return {
          ...f,
          mcrules: Object.fromEntries(
            Object.keys(f.crules)
              .map(k => [k,
                f.crules[k].map(p => [{ ...p[0], exp_value: computeBooleanExpectedValue(p[0]) }, p[1]])])),
        };
      }
      return f;
    });
  console.log('tfeature', tfeature);

  // all values of a single features are grouped by the name of the feature
  const rFeatures = d3.group(tfeature, d => d.rname);
  console.log('rFeatures', rFeatures.entries());
  // after the aggregation, we create a list of objects with the properties of the feature
  const rEntries = Array.from(rFeatures.entries())
    .map(d => ({
      rname: d[0],
      values: d[1],
      feature_importance: d3.sum(d[1], f => f.feature_importance),
      type: d[1][0].type,
      highlighted: false, // flag if a feature is selected
      status: 0, // flag to indicate the status of the feature. 0: normal, 1: selected
      rows: d[1].length, // how many distinct values the feature has
    }))
    // since each value as references to a rule or counterrules, we select only those values
    // that have a rule, i.e. the corresponding v.rule array is not empty and the value is the
    // instance value
    .map(f => ({ ...f,
      rvalues: f.values.filter(v =>
        ((v.rule.length > 0) && (v.instance_value > 0))) }))
    .map(f => ({ ...f,
      // TODO: here we should add a copy of d.values with a boolean value to indicate
      // if the predicate of the counter rule holds or not. This set of values will be used
      // to draw the corresponding values for the counter rule. This only for categorical
      // data types. No need for the numeric data

      crvalues: f.values.filter(v =>
        Object.keys(v.crules).length) }))
    .map(f => ({
      ...f,
      values: f.values.map(v => ({
        ...v,
        crvalues: [],
        rvalues: [],
      })),
    }));
  console.log('rEntries', rEntries);
  rEntries.sort((a, b) => (b.feature_importance) - (a.feature_importance));

  // this list contains the set of all the counterRules that are present in the explanation
  // object. This is used to create the legend and selectors of the visualization
  const CRulesList = Array.from(new Set(rEntries
    .map(e => e.values.map(v =>
      (v.mcrules ? Object.entries(v.mcrules).map(r => r[0]) : []))).flat().flat()));
  console.log('CRulesList', CRulesList);
  let eEntries = rEntries.map(e => ({
    ...e,
    crmatrix: CRulesList.map(c => // for each CounterRule,
      // for each value in the current Feature
      e.values.map(v =>
        // check if the current CR id is present in the mcrules of the current value
        (v.mcrules ? v.mcrules[c] : []))
        // in case of categorical features, we have a list of possible values.
        // We take the first position otherwise we take a -1
        .map(v => (v ? v[0] : -1))
        // for those entries where there is an array, we take the expected value
        // of the first element
        .map(v => ((v && v.length) ? v[0].exp_value : -1))
        //  we convert the boolean values as 0 or 1. We leave -1 values as they are
        // eslint-disable-next-line no-nested-ternary
        .map(d => (d === -1 ? -1 : (d ? 1 : 0))),
    ),
  }));
  // adjust the value of the crmatrix to have only 0 or 1 values
  eEntries = eEntries.map(e => ({
    ...e,
    crmatrix: adjustCounterRuleMatrix(e.crmatrix),
  }));

  console.log('eEntries', eEntries);


  const maxValues = d3.max(rEntries, d => d.values.length);
  const height = (rEntries.length + maxValues) * SINGLE_FEATURE_HEIGHT;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', GLOBAL_WIDTH + (4 * GUTTER))
    .attr('height', height + (4 * GUTTER))
    .attr('style', `background-color: ${FTTemplate.BACKGROUND_COLOR};`)
    .append('g')
    .attr('transform', `translate(${2 * GUTTER}, ${2 * GUTTER})`)
    ;


  const fv = FIPERView().width(GLOBAL_WIDTH).height(height);
  svg.datum(rEntries).call(fv);
});
