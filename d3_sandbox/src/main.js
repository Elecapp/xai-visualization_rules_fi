// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
const d3 = require('d3');

const GLOBAL_WIDTH = 900;
const SINGLE_FEATURE_HEIGHT = 30;
const FI_COLUMN_WIDTH = 50;
const RULES_COLUMN_WIDTH = 300;
const LABELS_COLUMN_WIDTH = 250;
const CRULES_GRID_COLUMN_WIDTH = 20;
const GUTTER = 10;
const VERTICAL_GUTTER = 6;
const FONT_SIZE = 11;

// create a function to darken a color using d3
function darkenColor(color, amount) {
  return d3.hsl(color).darker(amount).toString();
}
// create a dict for a color template
const colorSet = {
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
    BACKGROUND_COLOR: '#fff1e0',
    CRULES_COLOR: '#9e4f67',
    CRULES_STROKE_COLOR: '#854256',
    FI_POSITIVE_COLOR: '#626d8c',
    RULE_COLOR: '#f2c14e',
    RULE_STROKE_COLOR: '#d9a743',
    BASE_COLOR: '#dcc',
    BASE_STROKE_COLOR: '#BFB0B0',
    SECONDARY_BACKGROUND_COLOR: '#fdfdfd',
    TEXT_COLOR: '#333333',
    INSTANCE_COLOR: '#000',
    DISTRIBUTION_COLOR: '#dcc',
    DISTRIBUTION_STROKE_COLOR: '#BFB0B0',
    CATEGORICAL_INSTANCE_COLOR: '#B3B3B3',
    CATEGORICAL_INSTANCE_STROKE_COLOR: '#999999',
    NEGATIVE_FI_COLOR: '#f2aaaa',
    GRID_COLOR: '#000',
  },
};
const FTTemplate = colorSet.default;
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
      predicates: d.predicates,
      name: d.name,
    };
  }).filter(d => d.value > 0);
}

function FIPERFeatureInstanceValueView() {
  let width = RULES_COLUMN_WIDTH;
  let height = 51110;
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
        // .attr('y', height / 6)
        .attr('width', d => barLength(d.value))
        .attr('height', height)
        .attr('fill', FTTemplate.CATEGORICAL_INSTANCE_COLOR)
        // .attr('fill-opacity', 0.9)
        .attr('stroke', FTTemplate.CATEGORICAL_INSTANCE_STROKE_COLOR);
    } else {
      // selection.selectAll('rect.bck-instance-value')
      //   .data(d => d.values)
      //   .join('rect')
      //   .classed('bck-instance-value', true)
      //   .attr('x', 0)
      //   .attr('y', SINGLE_FEATURE_HEIGHT / 1.5)
      //   .attr('width', RULES_COLUMN_WIDTH)
      //   .attr('height', height / 6)
      //   .attr('fill', FTTemplate.DISTRIBUTION_COLOR)
      //   .attr('fill-opacity', 0.9)
      //   .attr('stroke', null);
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      selection.selectAll('rect.instance-value')
        .data(d => d.values)
        .join('rect')
        .classed('instance-value', true)
        .attr('x', d => (barLength(d.instance_value) - 2))
        // .attr('y', height / 5)
        .attr('width', 1.5)
        .attr('height', height)
        .attr('fill', FTTemplate.INSTANCE_COLOR);
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
      .attr('fill-opacity', 1)
      .attr('stroke', FTTemplate.DISTRIBUTION_STROKE_COLOR);
    selection.selectAll('line')
      .data(d => prepareNumericalValues(d.values).filter(v => v.type === 'line'))
      .join('line')
      .attr('x1', d => xScale(d.value0))
      .attr('x2', d => xScale(d.value1))
      .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
      .attr('stroke', FTTemplate.DISTRIBUTION_STROKE_COLOR)
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
  let strokeColor = FTTemplate.DISTRIBUTION_STROKE_COLOR;
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
      .attr('d', d => `${line(d)}Z`)
      .attr('fill', color)
      .attr('fill-opacity', 1)
      .attr('transform', `translate(0, -${SINGLE_FEATURE_HEIGHT / 6})`)
      .attr('stroke', strokeColor);

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
    yScale.range([height, height / 6]);
    return me;
  };

  // eslint-disable-next-line func-names
  me.color = function (_) {
    if (!arguments.length) return color;
    color = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.strokeColor = function (_) {
    if (!arguments.length) return strokeColor;
    strokeColor = _;
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
  let height = 5022222;
  const barLength = d3.scaleLinear()
    .range([0, width])
    .domain([0, 1]);
  let color = FTTemplate.DISTRIBUTION_COLOR;
  let strokeColor = FTTemplate.DISTRIBUTION_STROKE_COLOR;
  let fFilterRule = () => true;

  function me(selection) {
    const gDetails = selection.selectAll('g.details')
      .data(d => [d])
      .join('g')
      .classed('details', true)
      .attr('transform', `translate(0, ${1.5 * height})`)
      .attr('visibility', d => (d.status === 1 ? 'visible' : 'hidden'));

    if (selection.datum().type === 'categorical') {
      const total = d3.sum(selection.datum().values, d => d.eda.count);
      barLength.domain([0, total]);

      // selection.selectAll('rect.background')
      //   .data(d => [d])
      //   .join('rect')
      //   .classed('background', true)
      //   .attr('y', SINGLE_FEATURE_HEIGHT - height - 3)
      //   .attr('width', width)
      //   .attr('height', height)
      //   .attr('fill', 'white')
      //   .attr('fill-opacity', 0.4);

      const gSingleBar = selection.selectAll('g.single-bar')
        .data(d => [d])
        .join('g')
        .classed('single-bar', true);


      gSingleBar.selectAll('rect.single-bar')
        .data(d => prepareCategoricalValues(d.values))
        .join('rect')
        .classed('single-bar', true)
        .attr('x', d => barLength(d.cumulative))
        // .attr('y', height / 6)
        .attr('width', d => barLength(d.value))
        .attr('height', height)
        .attr('fill', color)
        .attr('fill-opacity', 1)
        .attr('stroke', strokeColor);

      if (selection.datum().status === 1) {
        // create an element g that will contain each single value of the feature
        // calculate the maximum length of the label to fit the text in the space,
        // considering the font size and the monospace font
        const maxLabelLength = Math.floor(LABELS_COLUMN_WIDTH / 5.5);
        const gFeatureValue = gDetails.selectAll('g.feature-value')
          .data(d => prepareCategoricalValues(d.values))
          .join('g')
          .classed('feature-value', true)
          .attr('transform', (d, i) => `translate(0, ${(i * height * 2) + (height / 2)})`);

        // draw the symbol for the actual value of the instance
        gFeatureValue.selectAll('rect.single-bar')
          .data(d => [d])
          .join('rect')
          .classed('single-bar', true)
          .attr('width', d => barLength(d.value))
          .attr('height', (height))
          .attr('fill', d => (d.instance_value ? FTTemplate.CATEGORICAL_INSTANCE_COLOR : color))
          // .attr('fill-opacity', d => (d.instance_value ? 1 : 0.2))
          .attr('stroke', d => (d.instance_value ? FTTemplate.CATEGORICAL_INSTANCE_STROKE_COLOR : strokeColor));
        // text for the labels for each value of the feature
        gFeatureValue.selectAll('text.single-bar')
          .data(d => [d])
          .join('text')
          .classed('single-bar', true)
          .attr('x', -GUTTER)
          .attr('dy', height / 2)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .attr('font-size', FONT_SIZE)
          .attr('font-weight', d => ((d.instance_value === 1) ? 'bold' : 'normal'))
          .attr('fill', d => ((d.instance_value === 1) ? FTTemplate.VALUE_TEXT_COLOR : FTTemplate.OTHER_TEXT_COLOR))
          .text(d => (d.label.length > maxLabelLength ? `${d.label.substring(0, maxLabelLength - 2)}…` : d.label));
        // text for the values for each value of the feature
        gFeatureValue.selectAll('text.single-bar-value')
          .data(d => [d])
          .join('text')
          .classed('single-bar-value', true)
          .attr('x', d => barLength(d.value) + GUTTER)
          .attr('dy', height / 2)
          .attr('text-anchor', 'start')
          .attr('alignment-baseline', 'middle')
          .attr('font-size', FONT_SIZE)
          .attr('fill', d => ((d.instance_value === 1) ? FTTemplate.VALUE_TEXT_COLOR : FTTemplate.OTHER_TEXT_COLOR))
          .text(d => `${d.value} (${d.percent.toFixed(2)}%)`);
      }
    } else {
      // Here we have a numerical feature
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);
      const ndbpv = FIPERNumericDistributionLineChartView()
        .xScale(barLength)
        .width(width)
        .height((SINGLE_FEATURE_HEIGHT * 2) / 3)
        .color(color)
        .strokeColor(strokeColor);
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
  me.strokeColor = function (_) {
    if (!arguments.length) return strokeColor;
    strokeColor = _;
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
  let strokeColor = FTTemplate.DISTRIBUTION_STROKE_COLOR;
  let isFactualRule = true;
  let selectedCounterRule = 'R0';


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
        .data(d => prepareCategoricalValues(d.values)
          .filter(v => v.predicates[selectedCounterRule] &&
            (v.predicates[selectedCounterRule].exp_value > 0)))
        .join('rect')
        .classed('single-predicate-bar', true)
        .attr('x', d => barLength(d.cumulative))
        .attr('width', d => barLength(d.value))
        .attr('height', height)
        .attr('fill', color)
        // set y attribute to height if isFactualRule is true and
        // predicates[selectedCounterRule].exp_value  == predicate['R0´].exp_value
        .attr('y', d => (!isFactualRule && (d.predicates.R0) && d.predicates[selectedCounterRule].exp_value === d.predicates.R0.exp_value ? height : 0))

        // .attr('fill', `url(#p_RULE_COLOR)`)
        .attr('fill-opacity', 1)
        .attr('stroke', strokeColor);
    } else {
      // Here we have a numerical feature
      barLength.domain([selection.datum().values[0].eda.min, selection.datum().values[0].eda.max]);

      // create a tranformation of the data to create additional fields for ranges
      // of rule predicate
      const ranges = selection.datum().values[0].predicates[selectedCounterRule] || [];
      // check if any of the intervals in ranges intersects the interval in
      // selection.datum().values[0].predicates['R0']
      let intersects = false;
      if (!isFactualRule && ranges.length && selection.datum().values[0].predicates.R0
        && selection.datum().values[0].predicates.R0.length) {
        // there is at least a predicate for the rule
        const r0 = selection.datum().values[0].predicates.R0[0];
        // check if r0 intersercts one of the intervals in ranges
        intersects = ranges.some(d => (d.interval[0] <= r0.interval[1]
          && d.interval[1] >= r0.interval[0]));
      }

      gPredicateBar.selectAll('rect.single-predicate-box')
        .data(ranges)
        .join('rect')
        .classed('single-predicate-box', true)
        .attr('x', d => barLength(d.interval[0]))
        .attr('y', d => (!isFactualRule && intersects ? height : 0))
        .attr('width', d => barLength(d.interval[1]) - barLength(d.interval[0]))
        .attr('height', subHeight)
        .attr('fill', color)
        .attr('fill-opacity', 1)
        .attr('stroke', strokeColor);
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

  me.strokeColor = function (_) {
    if (!arguments.length) return strokeColor;
    strokeColor = _;
    return me;
  };
  // eslint-disable-next-line func-names
  me.isFactualRule = function (_) {
    if (!arguments.length) return isFactualRule;
    isFactualRule = _;
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
  let width = LABELS_COLUMN_WIDTH;
  const maxLabelLength = Math.floor(LABELS_COLUMN_WIDTH / 5.5);
  let height = 50;
  const fontSize = FONT_SIZE;
  // create a scale to fit the length of the feature name
  const cLenght = d3.scaleLinear()
    .domain([0, maxLabelLength])
    .range([0, width]);
  function me(selection) {
    selection.selectAll('line.background')
      .data(d => [d])
      .join('line')
      .classed('background', true)
      .attr('x1', GUTTER)
      .attr('x2', d => (cLenght(d.rname.length) - GUTTER))
      .attr('y1', height / 4)
      .attr('y2', height / 4)
      .attr('stroke', FTTemplate.GRID_COLOR)
      .style('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.25);

    selection.selectAll('text.feature-name')
      .data(d => [d])
      .join('text')
      .classed('feature-name', true)
      .attr('x', width)
      .attr('y', height / 4)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', fontSize)
      .attr('font-weight', 'bold')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text(d => (d.rname.length > maxLabelLength ? `${d.rname.substring(0, maxLabelLength - 2)}…` : d.rname));

    selection.selectAll('text.feature-value')
      .data(d => [d])
      .join('text')
      .classed('feature-value', true)
      .attr('x', width)
      .attr('y', height / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'hanging')
      .attr('font-size', fontSize)
      .attr('fill', FTTemplate.VALUE_TEXT_COLOR)
      .text((d) => {
        if (d.type === 'categorical') {
          return d.values.filter(v => v.instance_value === 1).map(v => v.eda.category).join(', ');
        }
        return `${d.values[0].instance_value}`;
      })
      .attr('opacity', d => ((d.highlighted && d.type === 'categorical') ? 0 : 1));


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
      .attr('stroke', FTTemplate.GRID_COLOR)
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
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 0.3);
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      // .attr('x', (width / 2))
      .attr('y', SINGLE_FEATURE_HEIGHT / 4)
      .attr('width', d => barLength(Math.abs(d.feature_importance)))
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', d => (d.feature_importance < 0 ? FTTemplate.NEGATIVE_FI_COLOR : FTTemplate.FI_POSITIVE_COLOR));
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

function FIPERCRuleGrid() {
  let width = FI_COLUMN_WIDTH;
  let height = 50;
  let cruleList = [];
  let selectedCounterRule = 'C0';
  const bandScale = d3.scaleBand()
    .range([0, width])
    .padding(0.1);

  /**
   * This function receives one single ```g``` element and visualizes its
   * content using the associated data.
   * @param selection the element containing a single datum with the
   *  metadata of the feature to be visualized.
   */
  function me(selection) {
    // we need to scan all the values elements, to extract the exp_value from the dictionary
    // predicates...

    selection.selectAll('line.gridLine')
      .data(Object.keys(selection.datum().cRulesPredicateMap))
      .join('line')
      .classed('gridLine', true)
      .attr('x1', d => bandScale(d) + (bandScale.bandwidth() / 2))
      .attr('x2', d => bandScale(d) + (bandScale.bandwidth() / 2))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 0.3)
      .attr('stroke-dasharray', ('3, 3'));

    //
    selection.selectAll('circle.predicate')
      .data(bandScale.domain().filter(d => selection.datum().cRulesPredicateMap[d]))
      .join('circle')
      .classed('predicate', true)
      .attr('cx', d => bandScale(d) + (bandScale.bandwidth() / 2))
      .attr('cy', height / 2)
      .attr('r', 6)
      .attr('fill', d => ((d === selectedCounterRule) ? FTTemplate.CRULES_COLOR : FTTemplate.BASE_COLOR))
      .attr('stroke', d => ((d === selectedCounterRule) ? FTTemplate.CRULES_STROKE_COLOR : FTTemplate.BASE_STROKE_COLOR))
      .on('click', (d) => {
        console.log('clicked', d);
        console.log('coso', d3.select(d.target).datum());
      });
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    bandScale.range([0, width]);
    return me;
  };

  // eslint-disable-next-line
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  // eslint-disable-next-line
  me.cruleList = function (_) {
    if (!arguments.length) return cruleList;
    cruleList = _;
    bandScale.domain(cruleList);
    return me;
  };

  // eslint-disable-next-line func-names
  me.selectedCounterRule = function (_) {
    if (!arguments.length) return selectedCounterRule;
    selectedCounterRule = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.bandScale = function () {
    if (!arguments.length) return bandScale;
    return me;
  };

  return me;
}


function FIPERView() {
  // global width of the whole visualization
  let width = GLOBAL_WIDTH;
  // global height of the whole visualization
  let height = 500;
  // scale to position each feature row. HINT: maybe a d3.scaleBand() is better?
  const yScale = d3.scaleLinear();

  function me(selection) {
    const origDatum = selection.datum();
    // console.log('origDatum', origDatum);
    const features = selection.datum().features;
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
      .height((SINGLE_FEATURE_HEIGHT * 3) / 6)
      .color(FTTemplate.DISTRIBUTION_COLOR)
      .strokeColor(FTTemplate.DISTRIBUTION_STROKE_COLOR)
      .fFilterRule(() => true);
    // Component to visualize the layer for the rules
    const rpv = FIPERRulePredicateView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT / 6)
      .subHeight(SINGLE_FEATURE_HEIGHT / 6)
      .color('url(#p_RULE_COLOR)') // .color(FTTemplate.RULE_COLOR) for solid color
      .strokeColor(FTTemplate.RULE_STROKE_COLOR)
      .isFactualRule(true);
    // Component to visualize the layer for the counter rules
    const crpv = FIPERRulePredicateView()
      .width(RULES_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT / 6)
      .subHeight(SINGLE_FEATURE_HEIGHT / 6)
      .color('url(#p_CRULES_COLOR)') // .color(FTTemplate.CRULES_COLOR) for solid color
      .strokeColor(FTTemplate.CRULES_STROKE_COLOR)
      .isFactualRule(false)
      .selectedCounterRule(origDatum.selectedCounterRule);
    // Component to visualize the instance value for each row.
    const fivv = FIPERFeatureInstanceValueView()
      .width(RULES_COLUMN_WIDTH)
      .height((SINGLE_FEATURE_HEIGHT * 3) / 6);
    // Component to visualize the labels of the features at the beginning of each row
    const flv = FIPERFeatureLabelsView()
      .width(LABELS_COLUMN_WIDTH)
      .height(SINGLE_FEATURE_HEIGHT);
    // create variable width for the column of the counter rules
    const crWidth = origDatum.counterRules.length * CRULES_GRID_COLUMN_WIDTH;
    // component to visualize the grid of available counter rules
    const fcrg = FIPERCRuleGrid()
      .width(crWidth)
      .height(SINGLE_FEATURE_HEIGHT)
      .cruleList(origDatum.counterRules)
      .selectedCounterRule(origDatum.selectedCounterRule);


    // colorscale to be used to highlight the selected feature
    const highlightScale = d3.scaleOrdinal()
      .domain([false, true])
      .range(['transparent', FTTemplate.SECONDARY_BACKGROUND_COLOR]);

    // const backgroundHeight = d3.scaleOrdinal()
    //   .domain([0, 1, 2])
    //   .range([SINGLE_FEATURE_HEIGHT, 5 * SINGLE_FEATURE_HEIGHT, SINGLE_FEATURE_HEIGHT]);
    yScale.domain([0, features.length])
      .range([0, features.length * (SINGLE_FEATURE_HEIGHT + VERTICAL_GUTTER)]);


    const gcRuleGrid = selection.selectAll('g.cRuleGrid')
      .data(d => [d])
      .join('g')
      .classed('cRuleGrid', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER +
      RULES_COLUMN_WIDTH + GUTTER}, 0)`);

    gcRuleGrid.selectAll('text.label')
      .data(d => d.counterRules)
      .join('text')
      .classed('label', true)
      .attr('x', d => fcrg.bandScale()(d) + GUTTER)
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', -SINGLE_FEATURE_HEIGHT / 1.5)
      .attr('alignment-baseline', 'bottom')
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text(d => d)
      .on('click', (d) => {
        selection.datum(({
          ...origDatum,
          selectedCounterRule: d3.select(d.target).datum(),
        }));
        me(selection);
      });

    // create a group for each feature row
    const gFeatures = selection.selectAll('g.feature')
      .data(features)
      .join('g')
      .classed('feature', true)
      .attr('transform', (d, i) => `translate(0, ${yScale(i) + (d.status > 1 ? (d.rows) * SINGLE_FEATURE_HEIGHT : 0)})`);
    // a rectangle to set the widht and height of the feature row.
    gFeatures.selectAll('rect.background')
      .data(d => [d])
      .join('rect')
      .classed('background', true)
      .attr('y', -6)
      .attr('width', width)
      .attr('height', d => (d.status === 1 ? (d.rows + 1) * SINGLE_FEATURE_HEIGHT : SINGLE_FEATURE_HEIGHT))
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
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER + RULES_COLUMN_WIDTH + GUTTER + crWidth + GUTTER}, 0)`);
      gFeatureImportance.call(ffv);
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
      // The element g.rule is translated to the bottom part of the feature row
      // it is computed as 1 - 1/6 of the height of the feature row
      // thus it is 4/6
      gValueStack.selectAll('g.rule')
        .data(d => [d])
        .join('g')
        .classed('rule', true)
        .attr('transform', `translate(0, ${(3 * SINGLE_FEATURE_HEIGHT) / 6})`)
        .call(rpv);
      // The element g.crules is translated to the bottom part of the feature row
      // below the element g.rule. Thus it is 4/6 + 1/6 = 5/6
      gValueStack.selectAll('g.crules')
        .data(d => [d])
        .join('g')
        .classed('crules', true)
        .attr('transform', `translate(0, ${(3 * SINGLE_FEATURE_HEIGHT) / 6})`)
        .call(crpv);
      gValueStack.selectAll('g.crule-grid')
        .data(d => [d])
        .join('g')
        .classed('crule-grid', true)
        .attr('transform', `translate(${RULES_COLUMN_WIDTH + GUTTER}, 0)`)
        .call(fcrg);


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
      selection.datum(({
        ...origDatum,
        features: newFeatures,
      }));
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
  //     0 : (5) [ [0,0], [0,0], [-1, undef], [-1, undef], [-1, undef]]
  //     1 : (5) [ [-1, undef], [0,0], [-1, undef], [-1, undef], [-1, undef] ]
  //     2 : (5) [ [-1, undef], [0,0], [-1, undef], [-1, undef], [-1, undef] ]
  //     3 : (5) [ [-1, undef], [0,0], [-1, undef], [-1, undef], [-1, undef] ]
  // and we adjust the values to have only 0 or 1 in the first compoent.
  //  The approach is the following:
  // 1. If the maximum value of one row is 0, then all the -1 are changed to 1
  // 2. If the maximum value of one row is 1, then all the -1 are changed to 0
  // 3. If the maximum value of one row is -1, then we do nothing

  return matrix.map((r) => {
    const max = d3.max(r, v => v.exp_value);
    const minV = d3.min(r, v => v.consequent_class);
    if (max === 0) {
      return r.map(d => (d.exp_value === -1 ? ({ exp_value: 1, conquent_class: minV }) : d));
    }
    if (max === 1) {
      return r.map(d => (d.exp_value === -1 ? ({ exp_value: 0, conquent_class: minV }) : d));
    }
    return r;
  });
}

function rewritePredicatesCategorical(c, e, ruleSelector) { // for each CounterRule,
  // for each value in the current Feature
  return e.values.map(v =>
    // check if the current CR id is present in the crules of the current value
    (v[ruleSelector] ? v[ruleSelector][c] : []),
  )
    // in case of categorical features, we have a list of possible predicates
    // of the form {exp_value: false, conquent_class: 0}
    .map(v => ((v) ? v[0] : ({ exp_value: -1, consequent_class: 27 })))
    // for those entries where there is an array, we take the expected value
    // of the first element
    // .map(v => [v[0].exp_value, v[1]])
    //  we convert the boolean values as 0 or 1. We leave -1 values as they are
    .map(d => ({
      // eslint-disable-next-line no-nested-ternary
      exp_value: d.exp_value === -1 ? -1 : (d.exp_value ? 1 : 0),
      consequent_class: d.consequent_class,
    }));
}

function resolveInterval(pred, min, max) {
  // this function receives a predicate and the minimum and maximum values of the feature.
  // The predicate has the following form: {att: 'att_name', op: '>', thr: 0.5}
  // The function returns the interval that the predicate represents.
  // we enforce that the interval is within the bounds of the feature

  if (pred.op === '>') {
    return [Math.max(pred.thr, min), max];
  }
  if (pred.op === '>=') {
    return [Math.max(pred.thr, min), max];
  }
  if (pred.op === '<') {
    return [min, Math.min(pred.thr, max)];
  }
  if (pred.op === '<=') {
    return [min, Math.min(pred.thr, max)];
  }
  return [min, max];
}

function intervalUnion(intervals) {
  // this function receives a list of intervals and returns the union of all the intervals.
  // Each interval has the form {consequent_class: 0, interval: [0.5, 1]}
  if (intervals.length === 0) {
    return [];
  }
  intervals.sort((a, b) => a.interval[0] - b.interval[0]);
  const union = [];
  let current = intervals[0];

  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i].interval[0] <= current.interval[1]) {
      current.interval[1] = Math.min(current.interval[1], intervals[i].interval[1]);
    } else {
      union.push(current);
      current = intervals[i];
    }
  }

  union.push(current);
  return union;
}

function intervalIntersection(intervals) {
  // this function receives a list of intervals and returns the intersection of all the intervals.
  // Each interval has the form {consequent_class: 0, interval: [0.5, 1]}
  if (intervals.length < 2) {
    return [];
  }

  intervals.sort((a, b) => a.interval[0] - b.interval[0]);
  const intersection = [];
  let current = intervals[0];

  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i].interval[0] <= current.interval[1]) {
      current.interval[0] = Math.max(current.interval[0], intervals[i].interval[0]);
      current.interval[1] = Math.min(current.interval[1], intervals[i].interval[1]);
    } else {
      intersection.push(current);
      current = intervals[i];
    }
  }

  intersection.push(current);
  return intersection;
}

function reduceUnionIntersection(predicatesWithIntervals) {
  // this function receives a list of predicates with intervals and returns the intersection
  // of all the intervals.
  // Each predicate has the form {att: 'att_name', op: '>', thr: 0.5, interval: [0.5, 1]}
  if (predicatesWithIntervals.length === 0) {
    return [];
  }

  let result = intervalIntersection(predicatesWithIntervals);
  if (result.length === 0) {
    result = intervalUnion(predicatesWithIntervals);
  }

  return result;
}


d3.json('/static/instance_180.json').then((data) => {
  // console.log('data', data);
  // preprocess each entry to copmute the expected value for the categorical counterrules
  const tfeature = data.features
    // .filter(f => f.type === 'categorical')
    // .filter(f => Object.entries(f.crules).length)
    .map((f) => {
      if (f.type === 'categorical') {
        return {
          ...f,
          // transform the original crules into a dictionary where each entry is extended
          // with the expected value of the rule
          crules: Object.fromEntries(
            Object.keys(f.crules)
              .map(k => [k,
                f.crules[k].map(p =>
                  ({
                    exp_value: computeBooleanExpectedValue(p[0]),
                    consequent_class: p[1],
                  }),
                )])),
          rules: Object.fromEntries(
            ['R0'].map(k => [k,
              f.rule.map(p =>
                ({
                  exp_value: computeBooleanExpectedValue(p[0]),
                  consequent_class: p[1],
                }),
              )],
            ).filter(v => v[1].length > 0),
          ),
        };
      }
      return f;
    });
  // console.log('tfeature', tfeature);

  // all values of a single features are grouped by the name of the feature
  const rFeatures = d3.group(tfeature, d => d.rname);
  // after the aggregation, we create a list of objects with the properties of the feature
  const rEntries = Array.from(rFeatures.entries())
    .map(d => ({
      rname: d[0],
      values: d[1].map(v => ({ ...v, rvalues: [], crvalues: [] })),
      feature_importance: d3.sum(d[1], f => f.feature_importance),
      type: d[1][0].type,
      highlighted: false, // flag if a feature is selected
      status: 0, // flag to indicate the status of the feature. 0: normal, 1: selected
      rows: d[1].length, // how many distinct values the feature has
      // rvalues: [], // to be removed
      // crvalues: [], // to be removed
    }));
  // since each value as references to a rule or counterrules, we select only those values
  // that have a rule, i.e. the corresponding v.rule array is not empty and the value is the
  // instance value
  // console.log('rEntries', rEntries);

  // this list contains the set of all the counterRules that are present in the explanation
  // object. This is used to create the legend and selectors of the visualization
  const CRulesList = Array.from(new Set(rEntries
    .map(e => e.values.map(v =>
      (v.crules ? Object.entries(v.crules).map(r => r[0]) : []))).flat().flat()));

  // console.log('CRulesList', CRulesList);
  // first manage the counter rules for categorical features
  // =============================================================
  //            CATEGORICAL FEATURES
  // =============================================================
  const cEntries = rEntries.filter(e => e.type === 'categorical').map(e => ({
    ...e,
    crmatrix: adjustCounterRuleMatrix(CRulesList.map(c => rewritePredicatesCategorical(c, e, 'crules'))),
    rmatrix: adjustCounterRuleMatrix(['R0'].map(c => rewritePredicatesCategorical(c, e, 'rules'))),
  })).map(e => ({
    ...e,
    values: e.values.map((v, i) => ({
      ...v,
      // we add the bitmap to decide if this value is visible for a specific counter rule.
      predicates: Object.fromEntries(
        CRulesList.map((_, j) => [_, e.crmatrix[j][i]])
          .concat([['R0', e.rmatrix[0][i]]])
          .filter(vv => vv[1].exp_value >= 0),
      ),
    }))
      .map(v => ({
        eda: v.eda,
        feature_importance: v.feature_importance,
        instance_value: v.instance_value,
        name: v.name,
        rname: v.rname,
        type: v.type,
        predicates: v.predicates,
      })),
  })).map(e => ({
    ...e,
    cRulesPredicateMap: Object.fromEntries(CRulesList.map(c => [c, (
      e.values.map((v) => {
        if (c in v.predicates) {
          return v.predicates[c].exp_value > 0;
        }
        return false;
      }).reduce((acc, curr) => acc || curr, false)
    )])),
    rulePredicateMap: Object.fromEntries(['R0'].map(c => [c, (
      e.values.map((v) => {
        if (c in v.predicates) {
          return v.predicates[c].exp_value > 0;
        }
        return false;
      }).reduce((acc, curr) => acc || curr, false)
    )])),
  }));

  // then manage the counter rules for numerical features
  // =============================================================
  //            NUMERICAL FEATURES
  // =============================================================
  const nEntries = rEntries.filter(e => e.type === 'numeric')
    // transform each predicate into a dictionary with the consequent class
    .map(e => ({
      ...e,
      values: e.values.map(v => ({
        ...v,
        rule: v.rule.map(r => ({
          attr: r[0].att,
          op: r[0].op,
          thr: r[0].thr,
          consequent_class: r[1],
        })),
        predicates: Object.fromEntries(
          CRulesList.map(c => [c, v.crules[c] ? v.crules[c].map(r => ({
            attr: r[0].att,
            op: r[0].op,
            thr: r[0].thr,
            consequent_class: r[1],
          })) : []])
            .concat([['R0', v.rule.map(r => ({
              attr: r[0].att,
              op: r[0].op,
              thr: r[0].thr,
              consequent_class: r[1],
            }))]])
            .map(pr => [pr[0], pr[1].map(pl => ({
              ...pl,
              // find the actual interval of the predicate
              interval: resolveInterval(pl, v.eda.min, v.eda.max),
            }))])
            .map(pr => [pr[0], reduceUnionIntersection(pr[1])]),
        ),
      })),
    })).map(e => ({
      ...e,
      cRulesPredicateMap: Object.fromEntries(CRulesList.map(c => [c, (
        e.values.map((v) => {
          if (c in v.predicates) {
            return v.predicates[c].length > 0;
          }
          return false;
        }).reduce((acc, curr) => acc || curr, false)
      )])),
      rulePredicateMap: Object.fromEntries(['R0'].map(c => [c, (
        e.values.map((v) => {
          if (c in v.predicates) {
            return v.predicates[c].length > 0;
          }
          return false;
        }).reduce((acc, curr) => acc || curr, false)
      )])),
    }));


  // concatenate cEntries and nEntries into a single array
  const aEntries = cEntries.concat(nEntries);
  // sort the entries by feature importance
  aEntries.sort((a, b) => (b.feature_importance) - (a.feature_importance));

  // sort the entries by the number of true values in cRulesPredicateMap
  // aEntries.sort((a, b) =>
  //   (d3.sum(Object.values(b.cRulesPredicateMap)) - d3.sum(Object.values(a.cRulesPredicateMap))));

  // sort the entries by the number of true values in rulePredicateMap
  // aEntries.sort((a, b) =>
  //   (d3.sum(Object.values(b.rulePredicateMap)) - d3.sum(Object.values(a.rulePredicateMap))));


  const explanationDescriptor = {
    features: aEntries,
    counterRules: CRulesList,
    bb_pred: data.bb_pred,
    dt_pred: data.dt_pred,
    selectedCounterRule: 'C0',
  };


  const maxValues = d3.max(aEntries, d => d.values.length);
  const height = (aEntries.length + maxValues) * SINGLE_FEATURE_HEIGHT;
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', GLOBAL_WIDTH)
    .attr('height', height)
    .attr('style', `background-color: ${FTTemplate.BACKGROUND_COLOR};`)
    .append('g')
    .attr('transform', `translate(0, ${2 * GUTTER})`)
  ;


  const fv = FIPERView().width(GLOBAL_WIDTH).height(height);
  const defs = svg.selectAll('defs')
    .data([null]) // Usa un array con un singolo elemento come dati
    .join('defs');


  const spacing = 2;
  const thickness = 3;
  const rotation = 45;


  // create a pattern for each color in the template to be used in the visualization
  Object.keys(FTTemplate).forEach((key) => {
    defs.append('pattern')
      .attr('id', `p_${key}`)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', spacing + (thickness / 2))
      .attr('height', spacing + (thickness / 2))
      .attr('patternTransform', (key === 'CRULES_COLOR' ? `rotate(${rotation})` : `rotate(${-rotation})`))
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', spacing + (thickness / 2))
      .attr('stroke', FTTemplate[key])
      .attr('stroke-width', thickness);
  });
  svg.datum(explanationDescriptor).call(fv);
});
