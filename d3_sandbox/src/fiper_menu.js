import {
  FI_COLUMN_WIDTH,
  RULES_COLUMN_WIDTH,
  LABELS_COLUMN_WIDTH,
  GUTTER,
  MENU_HEIGHT,
  CRULES_GRID_COLUMN_WIDTH,
  FONT_SIZE,
  colorSet,
  dispatcher,
  SINGLE_FEATURE_HEIGHT,
  VERTICAL_GUTTER,
} from './constants';

const d3 = require('d3');

const FTTemplate = colorSet.default;

function FiperMenuCRule() {
  let bandScale = d3.scaleBand();

  function me(selection) {
    const explanationDescriptor = selection.datum();

    const gcRuleButtons = selection.selectAll('g.counterRule')
      .data(d => d.counterRules)
      .join('g')
      .classed('counterRule', true)
      .attr('transform', d => `translate(${bandScale(d)}, 0)`)
      .on('click', (d) => {
        let selectedCounterRule = d3.select(d.target).datum();
        if (explanationDescriptor.selectedCounterRule === selectedCounterRule) {
          selectedCounterRule = 'R9999999';
        } else {
          selectedCounterRule = d3.select(d.target).datum();
        }

        dispatcher.call('changeCounterRule', null, selectedCounterRule);
      });

    gcRuleButtons.selectAll('rect.counterRule')
      .data(d => [d])
      .join('rect')
      .classed('counterRule', true)
      .attr('width', CRULES_GRID_COLUMN_WIDTH)
      .attr('height', (MENU_HEIGHT / 3) * 2)
      .attr('transform', `translate(0, ${MENU_HEIGHT / 3})`)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('fill-opacity', 1)
      .attr('fill', d => (d === explanationDescriptor.selectedCounterRule ? FTTemplate.CRULES_COLOR : FTTemplate.BASE_COLOR))
      .attr('stroke', d => (d === explanationDescriptor.selectedCounterRule ? FTTemplate.CRULES_STROKE_COLOR : FTTemplate.BASE_STROKE_COLOR));

    gcRuleButtons.selectAll('text.label')
      .data(d => [d])
      .join('text')
      .classed('label', true)
      .attr('x', CRULES_GRID_COLUMN_WIDTH / 2)
      .attr('y', (MENU_HEIGHT / 3) * 2)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', FONT_SIZE)
      .attr('font-weight', d => (d === explanationDescriptor.selectedCounterRule ? 500 : 400))
      .attr('fill', d => (d === explanationDescriptor.selectedCounterRule ? '#eee' : FTTemplate.TEXT_COLOR))
      .attr('cursor', 'pointer')
      .text(d => d);
  }

  // eslint-disable-next-line func-names
  me.bandScale = function (_) {
    if (!arguments.length) return bandScale;
    bandScale = _;
    return me;
  };

  return me;
}

function FiperMenuOrderBy() {
  const orderByOptions = {
    'Feature Importance': true, 'Rules first': false, 'Counter Rules first': false, Alphabetical: false,
  };

  function me(selection) {
    selection.selectAll('text.label')
      .data(d => [d])
      .join('text')
      .classed('label', true)
      .attr('x', 0)
      .attr('y', (SINGLE_FEATURE_HEIGHT / 2) - (FONT_SIZE / 2))
      .attr('font-size', FONT_SIZE)
      .attr('font-weight', 400)
      .attr('dy', '1em')
      .attr('dx', '0.5em')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text('ORDER BY');

    const generateEvent = (d) => {
      const selectedKey = d3.select(d.target).datum();
      Object.keys(orderByOptions).forEach((key) => {
        orderByOptions[key] = key === selectedKey;
      });
      dispatcher.call('changeOrder', null, selectedKey);
    };

    selection.selectAll('text.orderBy')
      .data(Object.keys(orderByOptions))
      .join('text')
      .classed('orderBy', true)
      .attr('x', (d, i) => (Math.floor(i / 2) * RULES_COLUMN_WIDTH) / 2)
      .attr('y', (d, i) => ((i % 2) * (SINGLE_FEATURE_HEIGHT)) + SINGLE_FEATURE_HEIGHT + GUTTER)
      .attr('font-size', FONT_SIZE)
      .attr('dy', (SINGLE_FEATURE_HEIGHT / 2) - (FONT_SIZE / 2))
      .attr('dx', '2em') // we leave some space for the checkbox
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('font-weight', d => (orderByOptions[d] ? 500 : 400))
      .text(d => d)
      .style('cursor', 'pointer')
      .on('click', generateEvent);

    selection.selectAll('rect.checkbox')
      .data(Object.keys(orderByOptions))
      .join('rect')
      .classed('checkbox', true)
      .attr('x', (d, i) => 2 + ((Math.floor(i / 2) * RULES_COLUMN_WIDTH) / 2) + VERTICAL_GUTTER)
      .attr('y', (d, i) => ((i % 2) * SINGLE_FEATURE_HEIGHT) + SINGLE_FEATURE_HEIGHT + ((SINGLE_FEATURE_HEIGHT / 2) - (FONT_SIZE / 2)))
      .attr('width', FONT_SIZE)
      .attr('height', FONT_SIZE)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('fill-opacity', d => (orderByOptions[d] ? 0.8 : 0.2))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', generateEvent);

    selection.selectAll('line.horizontalLine')
      .data([1, 2, 3])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', 0)
      .attr('y1', d => (d * SINGLE_FEATURE_HEIGHT))
      .attr('x2', RULES_COLUMN_WIDTH)
      .attr('y2', d => (d * SINGLE_FEATURE_HEIGHT))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);

    selection.selectAll('line.verticalLine')
      .data(d => [d])
      .join('line')
      .classed('verticalLine', true)
      .attr('x1', RULES_COLUMN_WIDTH / 2)
      .attr('y1', SINGLE_FEATURE_HEIGHT)
      .attr('x2', RULES_COLUMN_WIDTH / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT * 3)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);
  }

  return me;
}


function FiperMenuFilterBy() {
  const filterByOptions = {
    Rules: false, CRules: false,
  };

  function me(selection) {
    selection.selectAll('text.label')
      .data(d => [d])
      .join('text')
      .classed('label', true)
      .attr('x', 0)
      .attr('y', (SINGLE_FEATURE_HEIGHT / 2) - (FONT_SIZE / 2))
      .attr('font-size', FONT_SIZE)
      .attr('font-weight', 400)
      .attr('dy', '1em')
      .attr('dx', '0.5em')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text('FILTER BY');

    const generateEvent = (d) => {
      const selectedKey = d3.select(d.target).datum();
      Object.keys(filterByOptions).forEach((key) => {
        if (key !== selectedKey) {
          filterByOptions[key] = false;
        }
      });
      filterByOptions[selectedKey] = !filterByOptions[selectedKey];
      dispatcher.call('changeFilter', null, filterByOptions[selectedKey] ? selectedKey : null);
    };

    selection.selectAll('text.filterBy')
      .data(Object.keys(filterByOptions))
      .join('text')
      .classed('filterBy', true)
      .attr('x', (d, i) => (Math.floor(i / 2) * RULES_COLUMN_WIDTH) / 2)
      .attr('y', (d, i) => ((i % 2) * (SINGLE_FEATURE_HEIGHT)) + SINGLE_FEATURE_HEIGHT + GUTTER)
      .attr('font-size', FONT_SIZE)
      .attr('dy', (SINGLE_FEATURE_HEIGHT / 2) - (FONT_SIZE / 2))
      .attr('dx', '2em') // we leave some space for the checkbox
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text(d => d)
      .style('cursor', 'pointer')
      .on('click', generateEvent);

    selection.selectAll('rect.checkbox')
      .data(Object.keys(filterByOptions))
      .join('rect')
      .classed('checkbox', true)
      .attr('x', (d, i) => 2 + ((Math.floor(i / 2) * RULES_COLUMN_WIDTH) / 2) + VERTICAL_GUTTER)
      .attr('y', (d, i) => ((i % 2) * (SINGLE_FEATURE_HEIGHT)) + SINGLE_FEATURE_HEIGHT + GUTTER)
      .attr('width', FONT_SIZE)
      .attr('height', FONT_SIZE)
      .attr('fill', d => (d === 'Rules' ? FTTemplate.RULE_COLOR : FTTemplate.CRULES_COLOR))
      .attr('fill-opacity', d => (filterByOptions[d] ? 0.8 : 0.2))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', generateEvent);

    selection.selectAll('line.horizontalLine')
      .data([1, 2, 3])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', 0)
      .attr('y1', d => (d * SINGLE_FEATURE_HEIGHT))
      .attr('x2', FI_COLUMN_WIDTH)
      .attr('y2', d => (d * SINGLE_FEATURE_HEIGHT))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);
  }

  return me;
}

// Format the data (instead of using d3.stack()) and
// filter out 0 values:
// extracted from: https://observablehq.com/@eesur/d3-single-stacked-bar
function prepareCategoricalValues(data, val) {
  // filter out data that has zero values
  // also get mapping for next placement
  // (save having to format data for d3 stack)
  let cumulative = 0;
  return data.map((d, i) => {
    cumulative += d;
    return {
      value: d,
      // want the cumulative to prior value (start of rect)
      cumulative: cumulative - d,
      instance_value: (val === i) ? 1 : 0,
    };
  }).filter(d => d.value > 0);
}

function FiperMenuClassesBarChart() {
  let width = 200;
  let height = 300;
  const lengthScale = d3.scaleLinear();


  function me(selection) {
    selection.selectAll('rect.pproba')
      .data(d => prepareCategoricalValues(d.predicted_proba, d.predicted_class))
      .join('rect')
      .classed('pproba', true)
      .attr('x', d => lengthScale(d.cumulative))
      .attr('y', 0)
      .attr('width', d => lengthScale(d.value))
      .attr('height', height)
      .attr('fill', d => (d.instance_value === 1 ? FTTemplate.CATEGORICAL_INSTANCE_COLOR : FTTemplate.DISTRIBUTION_COLOR))
      .attr('stroke', FTTemplate.DISTRIBUTION_STROKE_COLOR);
  }

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    lengthScale.range([0, width]);
    return me;
  };

  // eslint-disable-next-line func-names
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  return me;
}

function FiperMenu() {
  let width = 200;
  let height = 500;
  let bandScale = d3.scaleBand();
  const menuOrderBy = FiperMenuOrderBy();
  const menuCRulesCall = FiperMenuCRule().bandScale(bandScale);
  const menuFilterBy = FiperMenuFilterBy();

  function me(selection) {
    // create a group to contain the menu elements:
    // 1. the feature importance
    // 2. the distribution of the values
    // 3. the labels
    const gMenu = selection.selectAll('g.menu')
      .data(d => [d])
      .join('g')
      .classed('menu', true);

    const explanationDescriptor = selection.datum();
    const CRulesList = explanationDescriptor.counterRules;

    const classificationRect = gMenu.selectAll('g.classification')
      .data(d => [d])
      .join('g')
      .classed('classification', true)
      .attr('transform', `translate(${GUTTER}, ${GUTTER})`)
      .attr('width', LABELS_COLUMN_WIDTH - SINGLE_FEATURE_HEIGHT - GUTTER)
      .attr('height', MENU_HEIGHT);

    classificationRect.selectAll('rect.classification')
      .data(d => [d])
      .join('rect')
      .classed('classification', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', LABELS_COLUMN_WIDTH - SINGLE_FEATURE_HEIGHT - GUTTER)
      .attr('height', MENU_HEIGHT)
      .attr('fill', `${FTTemplate.SECONDARY_BACKGROUND_COLOR}`);

    classificationRect.selectAll('line.horizontalLine')
      .data([1])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', GUTTER)
      .attr('y1', d => d * SINGLE_FEATURE_HEIGHT)
      .attr('x2', LABELS_COLUMN_WIDTH - SINGLE_FEATURE_HEIGHT - (2 * GUTTER))
      .attr('y2', d => d * SINGLE_FEATURE_HEIGHT)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);

    classificationRect.selectAll('text.classification')
      .data(d => [d])
      .join('text')
      .classed('classification', true)
      .attr('x', 0)
      .attr('y', (FONT_SIZE / 2))
      .attr('font-size', FONT_SIZE)
      .attr('alignment-baseline', 'middle')
      .attr('font-weight', 400)
      .attr('dy', '1em')
      .attr('dx', GUTTER)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .html(d => `The instance is classified as <tspan font-weight="500" alignment-baseline="middle">${d.predicted_class}</tspan>`);

    const formatValue = d3.format('.2%');
    const pprobaBars = FiperMenuClassesBarChart().width(width)
      .height(SINGLE_FEATURE_HEIGHT / 2);
    classificationRect.selectAll('text.pproba')
      .data(d => [d])
      .join('text')
      .classed('pproba', true)
      .attr('x', 0)
      .attr('y', SINGLE_FEATURE_HEIGHT + (FONT_SIZE / 2))
      .attr('font-size', FONT_SIZE)
      .attr('alignment-baseline', 'middle')
      .attr('font-weight', 400)
      .attr('dy', '1em')
      .attr('dx', GUTTER)
      .attr('fill', FTTemplate.TEXT_COLOR)
      .html(d => `with a probability of <tspan font-weight="500" alignment-baseline="middle">
            ${formatValue(d.predicted_proba[d.predicted_class])}</tspan>`);

    classificationRect.selectAll('g.pproba')
      .data(d => [d])
      .join('g')
      .classed('pproba', true)
      .attr('transform', `translate(${GUTTER / 2}, ${(SINGLE_FEATURE_HEIGHT * 2)})`)
      .call(pprobaBars);

    // =========================================================
    //                  Visualization blocks titles
    // =========================================================

    const gTitles = selection.selectAll('g.titles')
      .data(d => [d])
      .join('g')
      .classed('titles', true)
      .attr('transform', `translate(${GUTTER}, ${MENU_HEIGHT + (SINGLE_FEATURE_HEIGHT)})`)
      .attr('width', LABELS_COLUMN_WIDTH + GUTTER + RULES_COLUMN_WIDTH + GUTTER + (CRulesList.length * CRULES_GRID_COLUMN_WIDTH) + GUTTER + FI_COLUMN_WIDTH + GUTTER)
      .attr('height', SINGLE_FEATURE_HEIGHT);

    const labels = ['Feature', 'Feature Distribution', 'C.Rules', 'F.I.'];
    const widthColumn = [
      LABELS_COLUMN_WIDTH,
      RULES_COLUMN_WIDTH,
      ((CRulesList.length) * CRULES_GRID_COLUMN_WIDTH),
      FI_COLUMN_WIDTH,
    ];
    // horizontal separator lines
    gTitles.selectAll('line.separator')
      .data([1])
      .join('line')
      .classed('separator', true)
      .attr('x1', 0)
      .attr('y1', -5)
      .attr('x2', widthColumn.reduce((a, b) => a + b, 0) + (GUTTER * 3))
      .attr('y2', -5)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .style('stroke-dasharray', ('3, 3'))
      .attr('stroke-width', 0.5);

    gTitles.selectAll('line.horizontalLine')
      .data(labels)
      .join('line')
      .classed('horizontalLine', true)
      .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
      .attr('x1', (d, i) => {
        if (i === 0) {
          return ((GUTTER * i) + widthColumn.slice(0, i).reduce((a, b) => a + b, 0));
        }
        return (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i));
      })
      .attr('x2', (d, i) =>
        // console.log('widthColumn', widthColumn);
        (widthColumn.slice(0, i + 1).reduce((a, b) => a + b, 0) + (GUTTER * i)),
      )
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 1)
      .attr('visibility', (d) => {
        if (d === 'C.Rules' && CRulesList.length <= 1) {
          return 'hidden';
        }
        return 'visible';
      });

    gTitles.selectAll('rect.padding')
      .data(labels)
      .join('rect')
      .classed('padding', true)
      .attr('x', (d, i) =>
        ((widthColumn.slice(0, i).reduce((a, b) => a + b, 0))
          + (((widthColumn[i] / 2) + (GUTTER * i)) - ((d.length * 6.5) / 2))
        ),
      )
      .attr('y', SINGLE_FEATURE_HEIGHT / 4)
      .attr('width', (d) => {
        if (d === 'C.Rules' && CRulesList.length === 1) {
          return 22;
        } else if (d === 'C.Rules' && CRulesList.length === 0) {
          return 0;
        }
        return (d.length * 6.5);
      })
      .attr('height', SINGLE_FEATURE_HEIGHT / 2)
      .attr('fill', FTTemplate.BACKGROUND_COLOR);
    gTitles.selectAll('text.label')
      .data(labels)
      .join('text')
      .classed('label', true)
      .attr('x', (d, i) =>
        // eslint-disable-next-line max-len,no-mixed-operators
        (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i) + (widthColumn[i] / 2)),
      )
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('font-size', FONT_SIZE)
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('cursor', 'default')
      .attr('font-weight', 500)
      .text((d) => {
        if (d === 'C.Rules' && CRulesList.length === 1) {
          return 'C.R';
        } else if (d === 'C.Rules' && CRulesList.length === 0) {
          return '';
        }
        return d;
      });

    // =========================================================
    //                  Order By Selector
    // =========================================================
    const gOrder = gMenu.selectAll('g.orderby')
      .data(d => [d])
      .join('g')
      .classed('orderby', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + (2 * GUTTER)}, ${GUTTER})`);
    gOrder.call(menuOrderBy);
    // =========================================================

    // =========================================================
    //                   Counter Rules Selector
    // =========================================================
    const menuCRules = gMenu.selectAll('g.cRuleGrid')
      .data(d => [d])
      .join('g')
      .classed('cRuleGrid', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + RULES_COLUMN_WIDTH + (3 * GUTTER)}, ${GUTTER})`);

    menuCRulesCall.bandScale(bandScale);
    menuCRules.call(menuCRulesCall);
    // =========================================================


    // =========================================================
    //                   Feature Importance
    // =========================================================


    const gFilter = gMenu.selectAll('g.filter')
      .data(d => [d])
      .join('g')
      .classed('filter', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + RULES_COLUMN_WIDTH + (CRULES_GRID_COLUMN_WIDTH * CRulesList.length) + (4 * GUTTER)}, ${GUTTER})`);
    gFilter.call(menuFilterBy);
    // =========================================================
  }

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.height = function (_) {
    if (!arguments.length) return height;
    height = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.bandScale = function (_) {
    if (!arguments.length) return bandScale;
    bandScale = _;
    return me;
  };

  return me;
}

export default FiperMenu;
