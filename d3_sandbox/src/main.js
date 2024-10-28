// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import FiperMenu from './fiper_menu';
import {
  GLOBAL_WIDTH,
  SINGLE_FEATURE_HEIGHT,
  FI_COLUMN_WIDTH,
  RULES_COLUMN_WIDTH,
  LABELS_COLUMN_WIDTH,
  GUTTER,
  VERTICAL_GUTTER,
  MENU_HEIGHT,
  FONT_SIZE,
  CRULES_GRID_COLUMN_WIDTH,
  colorSet,
  dispatcher,
} from './constants';

const d3 = require('d3');

function fontScaleFactor(fontSize) {
  const cWidthFactor = d3.scaleLinear()
    .domain([8, 13])
    .range([2, 2.6]);
  const fontScale = d3.scaleLinear()
    .domain([0, 10])
    .range([0, fontSize]);
  return Math.floor(((LABELS_COLUMN_WIDTH - GUTTER) * cWidthFactor(fontSize)) /
    (fontScale(fontSize)));
}
const maxLabelLength = fontScaleFactor(FONT_SIZE);

// create a function to darken a color using d3

let FTTemplate = colorSet.default;
// Format the data (instead of using d3.stack()) and
// filter out 0 values:
// extracted from: https://observablehq.com/@eesur/d3-single-stacked-bar
function prepareCategoricalValues(data) {
  const total = d3.sum(data, d => d.eda.count);

  // use a scale   to get percentage values
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
    return [eda.min, eda.q1, eda.median, eda.q3, eda.max];
  }

  function me(selection) {
    const feature = selection.datum();
    const g = selection.selectAll('g.axis')
      .data(d => [d])
      .join('g')
      .classed('axis', true)
      .attr('transform', `translate(0, ${height / 6})`);
    g.call(d3.axisBottom(xScale)
      .tickValues(prepareNumericalValues(feature.values)),
    );
    // avoid overlapping labels using vertical offset
    g.selectAll('.tick text')
      .attr('transform', (d, i, nodes) => {
        if ((i > 0)) {
          const prev = nodes[i - 1];
          if (d3.select(prev).attr('transform') === 'translate(0, 0)') {
            const prevBox = prev.getBBox();
            const curr = nodes[i];
            const currBox = curr.getBBox();
            if (currBox.x < (prevBox.x + prevBox.width)) {
              const offset = (prevBox.y + prevBox.height) - currBox.y;
              return `translate(0, ${offset})`;
            }
          }
        }
        return 'translate(0, 0)';
      });

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

function FIPERTextualExplanationView() {
  let selectedCounterRule = 'C0';

  function me(selection) {
    selection.selectAll('line.separator')
      .data(d => [d])
      .join('line')
      .classed('separator', true)
      .attr('x1', 0)
      .attr('x2', RULES_COLUMN_WIDTH)
      .attr('y1', d => (SINGLE_FEATURE_HEIGHT * (d.rows)) + 5)
      .attr('y2', d => (SINGLE_FEATURE_HEIGHT * (d.rows)) + 5)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      // .attr('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.25);


    const gRuleText = selection.selectAll('g.rule-text-explanation')
      .data(d => [d].filter(v => v.rulePredicateMap.R0))
      .join('g')
      .classed('rule-text-explanation', true)
      .attr('transform', `translate(0, ${SINGLE_FEATURE_HEIGHT * (selection.datum().rows + 1)})`);

    // create a rectangle that contain a text to be used as background
    gRuleText.selectAll('rect.text-rule-background')
      .data(d => [d])
      .join('rect')
      .classed('text-rule-background', true)
      .attr('x', (-(7 * 3) - 4) - GUTTER)
      .attr('y', -(SINGLE_FEATURE_HEIGHT / 2) + 4)
      .attr('width', (7 * 3) + 4)
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', FTTemplate.RULE_COLOR);

    gRuleText.selectAll('text.text-rule-label')
      .data(d => [d])
      .join('text')
      .classed('text-rule-label', true)
      .attr('x', -GUTTER - 2)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text('RULE');


    gRuleText.selectAll('text.text-rule')
      .data(d => [d])
      .join('text')
      .classed('text-rule', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('font-weight', '300')
      .html(d => d.ruleText.R0);

    const gCounterRuleText = selection.selectAll('g.counter-rule-text-explanation')
      .data(d => [d].filter(v => v.cRulesPredicateMap[selectedCounterRule]))
      .join('g')
      .classed('counter-rule-text-explanation', true)
      .attr('transform', `translate(0, ${SINGLE_FEATURE_HEIGHT * (selection.datum().rows + 2)})`);

    // create a rectangle that contain a text to be used as background
    gCounterRuleText.selectAll('rect.text-counter-rule-background')
      .data(d => [d])
      .join('rect')
      .classed('text-counter-rule-background', true)
      .attr('x', (-(22 * 3) - 4) - GUTTER)
      .attr('y', -(SINGLE_FEATURE_HEIGHT / 2) + 4)
      .attr('width', (22 * 3) + 4)
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', FTTemplate.CRULES_COLOR);

    gCounterRuleText.selectAll('text.text-counter-rule-label')
      .data(d => [d])
      .join('text')
      .classed('text-counter-rule-label', true)
      .attr('x', -GUTTER - 2)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.SECONDARY_BACKGROUND_COLOR)
      .text('COUNTER RULE');

    gCounterRuleText.selectAll('text.text-counter-rule')
      .data(d => [d])
      .join('text')
      .classed('text-counter-rule', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('font-weight', '300')
      .html(d => d.cruleText[selectedCounterRule]);

    return me;
  }

  // eslint-disable-next-line
  me.selectedCounterRule = function (_) {
    if (!arguments.length) return selectedCounterRule;
    selectedCounterRule = _;
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
  const textualExplanation = FIPERTextualExplanationView();

  const t = d3.transition()
    .duration(500)
    .ease(d3.easeLinear);

  function me(selection) {
    const gDetails = selection.selectAll('g.details')
      .data(d => [d])
      .join('g')
      .classed('details', true)
      .attr('transform', `translate(0, ${1.5 * height})`);

    gDetails
      .transition(t).duration(d => (d.status === 1 ? 500 : 100))
      .attr('opacity', d => (d.status === 1 ? 1 : 0));


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


        const gFeatureValue = gDetails.selectAll('g.feature-value')
          .data(d => prepareCategoricalValues(d.values))
          .join('g')
          .classed('feature-value', true)
          .attr('transform', (d, i) => `translate(0, ${(i * height * 2) + (height / 2)})`)
          .attr('width', RULES_COLUMN_WIDTH);

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
          .attr('dy', FONT_SIZE)
          .attr('text-anchor', 'end')
          .attr('font-size', FONT_SIZE)
          .attr('font-weight', d => ((d.instance_value === 1) ? '500' : '400'))
          .attr('fill', d => ((d.instance_value === 1) ? FTTemplate.VALUE_TEXT_COLOR : FTTemplate.OTHER_TEXT_COLOR))
          .text(d => (d.label.length > maxLabelLength ? `${d.label.substring(0, maxLabelLength - 2)}…` : d.label));
        // text for the values for each value of the feature
        gFeatureValue.selectAll('text.single-bar-value')
          .data(d => [d])
          .join('text')
          .classed('single-bar-value', true)
          .attr('x', d => barLength(d.value) + (GUTTER / 2))
          .attr('dy', FONT_SIZE)
          .attr('text-anchor', 'start')
          .attr('font-size', FONT_SIZE)
          .attr('fill', d => ((d.instance_value === 1) ? FTTemplate.VALUE_TEXT_COLOR : FTTemplate.OTHER_TEXT_COLOR))
          .text(d => `${d.value} (${d.percent.toFixed(2)}%)`);
      } else {
        gDetails.selectAll('g.feature-value').transition(t).remove();
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


    gDetails.call(textualExplanation);

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

  // eslint-disable-next-line func-names
  me.selectedCounterRule = function (_) {
    if (!arguments.length) return textualExplanation.selectedCounterRule();
    textualExplanation.selectedCounterRule(_);
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
        .attr('y', () => (!isFactualRule && intersects ? height : 0))
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

  // eslint-disable-next-line func-names
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
  let height = 50;
  // create a scale to fit the length of the feature name
  const cLenght = d3.scaleLinear()
    .domain([0, maxLabelLength])
    .range([0, width]);

  function me(selection) {
    selection.selectAll('line.background')
      .data(d => [d])
      .join('line')
      .classed('background', true)
      .attr('x1', 0)
      .attr('x2', d => (cLenght(d.rname.length) - GUTTER))
      .attr('x2', d => cLenght(Math.floor(maxLabelLength - d.rname.length)) - (2 * GUTTER))
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
      .attr('y', FONT_SIZE / 2)
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE)
      .attr('font-weight', '500')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text(d => (d.rname.length > maxLabelLength ? `${d.rname.substring(0, maxLabelLength - 2)}…` : d.rname));

    selection.selectAll('text.feature-value')
      .data(d => [d])
      .join('text')
      .classed('feature-value', true)
      .attr('x', width)
      .attr('y', FONT_SIZE + (FONT_SIZE / 2))
      .attr('text-anchor', 'end')
      .attr('font-size', FONT_SIZE)
      .attr('fill', FTTemplate.VALUE_TEXT_COLOR)
      .text((d) => {
        if (d.type === 'categorical') {
          const label = d.values.filter(v => v.instance_value === 1).map(v => v.eda.category).join(', ');
          return (label.length > maxLabelLength ? `${label.substring(0, maxLabelLength - 2)}…` : label);
        }
        return `${d.values[0].instance_value}`;
      })
      .attr('opacity', d => ((d.status === 1 && d.type === 'categorical') ? 0 : 1));


    return me;
  }

  // eslint-disable-next-line
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    cLenght.range([0, width]);
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
  let height = 50000;
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
      .attr('y1', (height / 2))
      .attr('y2', (height / 2))
      .attr('stroke', FTTemplate.GRID_COLOR)
      .style('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.25);
    selection.selectAll('line.axis')
      .data(d => [d])
      .join('line')
      .classed('axis', true)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 0.3);
    selection.selectAll('rect')
      .data(d => [d])
      .join('rect')
      // .attr('x', (width / 2))
      .attr('y', 0)
      .attr('width', d => barLength(Math.abs(d.feature_importance)))
      .attr('height', height)
      .attr('fill', d => (d.feature_importance < 0 ? FTTemplate.NEGATIVE_FI_COLOR : FTTemplate.FI_POSITIVE_COLOR));
    // selection.selectAll('rect')
    //   .filter(d => d.feature_importance < 0)
    //   .attr('x', d => (width / 2) - barLength(Math.abs(d.feature_importance)));

    if (selection.datum().status === 1) {
      const axis = d3.axisBottom(barLength)
        .tickValues([...fiExtent, Math.abs(selection.datum().feature_importance)])
        .tickFormat(d3.format('.2f'));

      if (selection.datum().feature_importance < 0) {
        axis.tickFormat(d => `-${d3.format('.2f')(d)}`);
      }

      selection.selectAll('g.fi-axis')
        .data(d => [d])
        .join('g')
        .classed('fi-axis', true)
        .attr('transform', `translate(0, ${(height * 11) / 6})`)
        .call(axis);
    } else {
      selection.selectAll('g.fi-axis').remove();
    }
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
      .attr('y1', -(SINGLE_FEATURE_HEIGHT) / 6)
      .attr('y2', (SINGLE_FEATURE_HEIGHT))
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 0.3)
      .attr('stroke-dasharray', ('3, 3'));

    //
    selection.selectAll('circle.predicate')
      .data(bandScale.domain().filter(d => selection.datum().cRulesPredicateMap[d]))
      .join('circle')
      .classed('predicate', true)
      .attr('cx', d => bandScale(d) + (bandScale.bandwidth() / 2))
      .attr('cy', ((SINGLE_FEATURE_HEIGHT * 3) / 6) / 2)
      .attr('r', 5)
      .attr('fill', d => ((d === selectedCounterRule) ? FTTemplate.CRULES_COLOR : FTTemplate.BASE_COLOR))
      .attr('stroke', d => ((d === selectedCounterRule) ? FTTemplate.CRULES_STROKE_COLOR : FTTemplate.BASE_STROKE_COLOR))
      .on('click', (d) => {
        dispatcher.call('changeCounterRule', this, d3.select(d.target).datum());
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

function text2tspan(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = `${currentLine} ${word}`;
    const testLength = testLine.length;
    if (testLength > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);
  // join lines with tspan elements
  return lines.map((line, i) => `<tspan x="0" dy="${i ? '1.2em' : 0}">${line}</tspan>`).join('');
}


function FIPERView() {
  // global width of the whole visualization
  let width = GLOBAL_WIDTH;
  // global height of the whole visualization
  let height = 500;
  // scale to position each feature row. HINT: maybe a d3.scaleBand() is better?
  const yScale = d3.scaleLinear();

  let fcrg = FIPERCRuleGrid();

  function me(selection) {
    const origDatum = selection.datum();
    // console.log('origDatum', origDatum);
    const oFeatures = selection.datum().features;
    // determine the maximum value of Feature Importance to fit the scale. We use absolute value
    // to ignore the sign of the feature importance
    const fiMax = d3.max(oFeatures, d => Math.abs(d.feature_importance));
    // create a scale to fit the feature importance values in absolute value
    const fiExtent = [0, fiMax];

    // prepare the features for visualization
    // given the order of the features, we scan all of them, to find that
    // feature that has the property status equal to 1. This feature will be
    // the selected one and will be displayes expanded.
    // The preceeding features will be displayed in a collapsed way and they
    // are marked with the property status equal to 0.
    // The following features will be displayed in a collapsed way and they
    // are marked with the property status equal to 2. For these features, we
    // need to calculate an offset to position them correctly. This offset is given
    // by the sum of the number of rows of the selected feature.


    let offsetRows = 0;
    const features = oFeatures.map((d) => {
    // We want to leave additional space (a couple of rows) if a rule or counterrule predicates
    // are present.
      const hasRule = d.rulePredicateMap.R0;
      // check if any of the counter-rules is set to true
      const hasCounterRules = Object.values(d.cRulesPredicateMap).some(v => v);
      let additionalRows = 0;
      if (hasRule) {
        additionalRows += 1;
      }
      if (hasCounterRules) {
        additionalRows += 1;
      }
      if (additionalRows > 0) {
        additionalRows += 1;
      }


      const f = {
        ...d,
        rows: d.values.length,
      };
      if (d.type === 'numeric') { f.rows = 2 + additionalRows; } // default values for numeric features.
      f.offsetRows = offsetRows;
      f.additionalRows = additionalRows;
      if (d.status === 1) { offsetRows = f.rows + additionalRows; }

      // Adding strings to be used for textual labels
      f.ruleText = Object.fromEntries(Object.entries(d.rulePredicateMap)
        .filter(([, v]) => v)
        .map(([k]) => [k, text2tspan(`Rule ${k}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla hendrerit lacus in mi.`, 55)]),
      );
      f.cruleText = Object.fromEntries(Object.entries(d.cRulesPredicateMap)
        .filter(([, v]) => v)
        .map(([k]) => [k, text2tspan(`Counter Rule ${k}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla hendrerit lacus in mi.`, 55)]),
      );

      return f;
    });

    // Component to handle the FI visualization for each feature
    const ffv = FIPERFeatureImportanceView()
      .width(FI_COLUMN_WIDTH)
      .height((SINGLE_FEATURE_HEIGHT * 3) / 6)
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
    fcrg = FIPERCRuleGrid()
      .width(crWidth)
      .height(SINGLE_FEATURE_HEIGHT)
      .cruleList(origDatum.counterRules)
      .selectedCounterRule(origDatum.selectedCounterRule);
    fdv.selectedCounterRule(origDatum.selectedCounterRule);


    // colorscale to be used to highlight the selected feature
    const highlightScale = d3.scaleOrdinal()
      .domain([0, 1])
      .range(['transparent', FTTemplate.SECONDARY_BACKGROUND_COLOR]);

    // const backgroundHeight = d3.scaleOrdinal()
    //   .domain([0, 1, 2])
    //   .range([SINGLE_FEATURE_HEIGHT, 5 * SINGLE_FEATURE_HEIGHT, SINGLE_FEATURE_HEIGHT]);
    yScale.domain([0, features.length])
      .range([0, features.length * (SINGLE_FEATURE_HEIGHT + VERTICAL_GUTTER)]);

    const t = d3.transition()
      .duration(500)
      .ease(d3.easeLinear)
      .on('end', () => {
        // console.log('Transition ended');
        setTimeout(() => {
          const bbox = selection.node().getBBox();
          selection.node().parentNode.setAttribute('height', bbox.height +
            ((2 * VERTICAL_GUTTER) + (MENU_HEIGHT + (2 * SINGLE_FEATURE_HEIGHT))));
        }, 300);
      });


    // create a group for each feature row
    const gFeatures = selection.selectAll('g.feature')
      .data(features, d => d.rname)
      .join('g')
      .classed('feature', true);

    gFeatures
      .transition(t)
      .attr('transform', (d, i) => `translate(0, ${yScale(i) + (d.offsetRows * SINGLE_FEATURE_HEIGHT)})`);
    // a rectangle to set the widht and height of the feature row.
    gFeatures.selectAll('rect.background')
      .data(d => [d])
      .join('rect')
      .classed('background', true)
      .attr('y', -6)
      .attr('width', width)
      .attr('height', d => (d.status === 1 ? (d.rows + d.additionalRows + 1) * SINGLE_FEATURE_HEIGHT : SINGLE_FEATURE_HEIGHT))
      .transition(t)
      .attr('fill', d => highlightScale(d.status));

    // for each feature row, we have 3 groups:
    // 1. the feature importance
    // 2. the distribution of the values
    // 3. the labels
    // We call separate components to handle each group. Each groups is located accordingly
    // to the size of the corresponsing COLUMN.

    gFeatures.each((_, j, n) => {
      const gLabels = d3.select(n[j]).selectAll('g.feature-labels')
        .data(d => [d])
        .join('g')
        .classed('feature-labels', true)
        .attr('transform', `translate(${GUTTER}, 0)`);
      gLabels.call(flv);
      const gValueStack = d3.select(n[j]).selectAll('g.feature-values')
        .data(d => [d])
        .join('g')
        .classed('feature-values', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + (2 * GUTTER)}, 0)`);
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
      const gFeatureImportance = d3.select(n[j]).selectAll('g.feature-importance')
        .data(d => [d])
        .join('g')
        .classed('feature-importance', true)
        .attr('transform', `translate(${LABELS_COLUMN_WIDTH + RULES_COLUMN_WIDTH + crWidth + (4 * GUTTER)}, 0)`);
      gFeatureImportance.call(ffv);
    });
    // eslint-disable-next-line func-names
    gFeatures.on('click', function () {
      const clickedFeature = d3.select(this).datum();
      gFeatures.data().forEach((d, i) => {
        if (d.rname === clickedFeature.rname) {
          // eslint-disable-next-line no-param-reassign
          selection.datum().features[i].status = (d.status === 1) ? 0 : 1;
        } else {
          // eslint-disable-next-line no-param-reassign
          selection.datum().features[i].status = 0;
        }
      });

      me(selection);
      const bbox = selection.node().getBBox();
      selection.node().parentNode.setAttribute('height', bbox.height +
        (GUTTER + (MENU_HEIGHT + (2 * SINGLE_FEATURE_HEIGHT))));
    });
  }

  // eslint-disable-next-line
  me.cRulesGridBandScale = function() {
    if (!arguments.length) return fcrg.bandScale();
    return me;
  };

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

d3.json('/static/abalone_explanations/instance_82.json').then((data) => {
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

  const explanationDescriptor = {
    features: aEntries,
    counterRules: CRulesList,
    predicted_class: data.predicted_class,
    predicted_proba: data.predicted_proba,
    selectedCounterRule: '',
    filterRules: false,
    filterCRules: false,
  };
  const fv = FIPERView().width(GLOBAL_WIDTH + (CRulesList.length * CRULES_GRID_COLUMN_WIDTH));
  const fm = FiperMenu();

  // TODO: fix the height of the visualization
  //  (it should be computed based on the number of max values of the features,
  //  test with "purpose" feature)
  const mainSvg = d3.select('#app')
    .append('svg')
    .classed('viz', true)
    .attr('width', fv.width())
    .attr('height', 200)
    .attr('style', `background-color: ${FTTemplate.BACKGROUND_COLOR};`);

  const svg = mainSvg
    .append('g')
    .attr('transform', `translate(0, ${6 + MENU_HEIGHT + (2 * SINGLE_FEATURE_HEIGHT)})`)
  ;

  const menuSvg = mainSvg
    .append('g').append('svg')
    .classed('menu', true)
    .attr('width', fv.width())
    .attr('height', MENU_HEIGHT + (2 * SINGLE_FEATURE_HEIGHT)) // added height of the menu + chart title here, check if it is correct
    .attr('style', `background-color: ${FTTemplate.BACKGROUND_COLOR};`);


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


  function refreshVisualization(descriptor) {
    const filterFunctionRule = f => d3.sum(Object.values(f.rulePredicateMap)) > 0;
    const filterFunctionCRule = f => d3.sum(Object.values(f.cRulesPredicateMap)) > 0;
    const filterFunctionBoth = f => (d3.sum(Object.values(f.rulePredicateMap)) +
      d3.sum(Object.values(f.cRulesPredicateMap))) > 0;

    let currentFilter = () => true;
    if (descriptor.filterRules) {
      currentFilter = filterFunctionRule;
    }
    if (descriptor.filterCRules) {
      currentFilter = filterFunctionCRule;
    }
    if (descriptor.filterRules && descriptor.filterCRules) {
      currentFilter = filterFunctionBoth;
    }

    const filteredDescriptor = {
      ...explanationDescriptor,
      features: explanationDescriptor.features.filter(currentFilter),
    };
    svg.datum(filteredDescriptor).call(fv);
    menuSvg.datum(filteredDescriptor).call(fm);
  }

  // it is important that fm component is called after fv has been called the first time
  // to ensure that the bandScale is correctly initialized
  refreshVisualization(explanationDescriptor);

  // compute the resulting bounding box to set the height of the svg
  // recall: `svg` variable is the group `g` that contains the visualization
  //        so we refer to the parent node to set the height correctly
  const bbox = mainSvg.node().getBBox();
  mainSvg.node().parentNode.setAttribute('height', bbox.height +
    (GUTTER + (MENU_HEIGHT + (2 * SINGLE_FEATURE_HEIGHT))));
  mainSvg.node().parentNode.setAttribute('width', bbox.width + GUTTER);
  fv.width(bbox.width + GUTTER);
  // menuSvg.node().setAttribute('width', bbox.width + GUTTER);


  dispatcher.on('changeCounterRule', (d) => {
    explanationDescriptor.selectedCounterRule = d;
    refreshVisualization(explanationDescriptor);
  });

  dispatcher.on('changeOrder', (d) => {
    if (d === 'Feature Importance') {
      explanationDescriptor.features.sort((a, b) =>
        (b.feature_importance) - (a.feature_importance));
    }
    if (d === 'Counter Rules first') {
      explanationDescriptor.features.sort((a, b) =>
        (d3.sum(Object.values(b.cRulesPredicateMap)) -
          d3.sum(Object.values(a.cRulesPredicateMap))));
    }
    if (d === 'Rules first') {
      explanationDescriptor.features.sort((a, b) =>
        (d3.sum(Object.values(b.rulePredicateMap)) - d3.sum(Object.values(a.rulePredicateMap))));
    }
    if (d === 'Alphabetical') {
      explanationDescriptor.features.sort((a, b) =>
        a.rname.localeCompare(b.rname));
    }
    refreshVisualization(explanationDescriptor);
  });
  dispatcher.on('changeFilter', (d) => {
    explanationDescriptor.filterRules = d.Rules;
    explanationDescriptor.filterCRules = d.CRules;

    refreshVisualization(explanationDescriptor);
  });

  dispatcher.on('changePalette', (d) => {
    const newTemplate = colorSet[d.value];
    FTTemplate = newTemplate;

    mainSvg
      .attr('style', `background-color: ${FTTemplate.BACKGROUND_COLOR};`);
    refreshVisualization(explanationDescriptor);
  });
});
