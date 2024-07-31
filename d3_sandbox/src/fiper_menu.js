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
      .attr('height', MENU_HEIGHT)
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
      .attr('y', MENU_HEIGHT / 2)
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
      .classed('menu', true)
      .attr('transform', 'translate(0, 0)');

    const explanationDescriptor = selection.datum();
    const CRulesList = explanationDescriptor.counterRules;

    const classificationRect = gMenu.selectAll('g.classification')
      .data(d => [d])
      .join('g')
      .classed('classification', true)
      .attr('transform', `translate(${GUTTER}, ${GUTTER})`)
      .attr('width', LABELS_COLUMN_WIDTH - GUTTER)
      .attr('height', MENU_HEIGHT);

    classificationRect.selectAll('rect.classification')
      .data(d => [d])
      .join('rect')
      .classed('classification', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', LABELS_COLUMN_WIDTH - GUTTER)
      .attr('height', MENU_HEIGHT)
      .attr('fill', FTTemplate.SECONDARY_BACKGROUND_COLOR);

    classificationRect.selectAll('line.horizontalLine')
      .data([1])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', GUTTER)
      .attr('y1', d => d * SINGLE_FEATURE_HEIGHT)
      .attr('x2', LABELS_COLUMN_WIDTH - (2 * GUTTER))
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
      .html(d => `The instance is classified as <tspan font-weight="500" alignment-baseline="middle">${d.bb_pred}</tspan>`);

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
      .html(d => `The prediction probability is <tspan font-weight="500" alignment-baseline="middle">${d.bb_pred * 100}%</tspan>`);

    // =========================================================
    //                  Visualization blocks titles
    // =========================================================

    const gTitles = selection.selectAll('g.titles')
      .data(d => [d])
      .join('g')
      .classed('labels', true)
      .attr('transform', `translate(${GUTTER}, ${MENU_HEIGHT + (2 * GUTTER)})`)
      .attr('width', LABELS_COLUMN_WIDTH + GUTTER + RULES_COLUMN_WIDTH + GUTTER + (CRulesList.length * CRULES_GRID_COLUMN_WIDTH) + GUTTER + FI_COLUMN_WIDTH + GUTTER)
      .attr('height', SINGLE_FEATURE_HEIGHT);

    const labels = ['Feature', 'Feature Distribution', 'C.Rules', 'F.I.'];
    const widthColumn = [
      LABELS_COLUMN_WIDTH,
      RULES_COLUMN_WIDTH,
      ((CRulesList.length) * CRULES_GRID_COLUMN_WIDTH),
      FI_COLUMN_WIDTH,
    ];

    gTitles.selectAll('line.horizontalLine')
      .data(labels)
      .join('line')
      .classed('horizontalLine', true)
      .attr('y1', SINGLE_FEATURE_HEIGHT / 2)
      .attr('y2', SINGLE_FEATURE_HEIGHT / 2)
      .attr('x1', (d, i) => {
        if (i === 0) {
          return (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + GUTTER);
        }
        return (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i));
      })
      .attr('x2', (d, i) => {
        console.log('widthColumn', widthColumn);
        return (widthColumn.slice(0, i + 1).reduce((a, b) => a + b, 0) + (GUTTER * i));
      })
      .attr('transform', `translate(${-GUTTER}, 0)`)
      .attr('stroke', FTTemplate.GRID_COLOR)
      .attr('stroke-width', 1)
      .attr('visibility', (d) => {
        if (d === 'C.Rules' && CRulesList.length <= 1) {
          return 'hidden';
        }
        return 'visible';
      });
    // add a background rectangle behind the text. The rectangle will be the same size as the text
    // and will be placed in the middle of the column:

    gTitles.selectAll('rect.label')
      .data(labels)
      .join('rect')
      .classed('label', true)
      .attr('x', (d, i) =>
        // eslint-disable-next-line max-len
        // (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i) + (widthColumn[i] / 2) - (d.length * 4) - GUTTER),
        (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (widthColumn[i] / 2) - ((d.length * 6.5)/2)),
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
      .attr('fill', FTTemplate.BACKGROUND_COLOR)
      .attr('stroke', FTTemplate.GRID_COLOR);

    gTitles.selectAll('text.label')
      .data(labels)
      .join('text')
      .classed('label', true)
      .attr('x', (d, i) =>
        // eslint-disable-next-line max-len,no-mixed-operators
        (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i) + (widthColumn[i] / 2) - GUTTER),
      )
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('font-size', FONT_SIZE)
      .attr('alignment-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('cursor', 'none')
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
    const gOrder = gMenu.selectAll('g.distribution')
      .data(d => [d])
      .join('g')
      .classed('distribution', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER}, ${GUTTER})`);
    gOrder.call(menuOrderBy);
    // =========================================================

    // =========================================================
    //                   Counter Rules Selector
    // =========================================================
    const menuCRules = gMenu.selectAll('g.cRuleGrid')
      .data(d => [d])
      .join('g')
      .classed('cRuleGrid', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER + RULES_COLUMN_WIDTH + GUTTER}, ${GUTTER})`);

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
      .attr('transform', `translate(${((CRULES_GRID_COLUMN_WIDTH * CRulesList.length) + GUTTER) + (LABELS_COLUMN_WIDTH + GUTTER) + (RULES_COLUMN_WIDTH + GUTTER)}, ${GUTTER})`);
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
