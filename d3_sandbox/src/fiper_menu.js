import {
  FI_COLUMN_WIDTH,
  RULES_COLUMN_WIDTH,
  LABELS_COLUMN_WIDTH,
  GUTTER,
  MENU_HEIGHT,
  CRULES_GRID_COLUMN_WIDTH,
  FONT_SIZE, colorSet,
  dispatcher, SINGLE_FEATURE_HEIGHT,
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
      .attr('transform', d =>
        `translate(${bandScale(d)}, 0)`)
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
      .attr('height', MENU_HEIGHT - (2 * GUTTER))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('fill-opacity', 0.5)
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
      .attr('fill', FTTemplate.TEXT_COLOR)
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
    'Feature Importance': true,
    'Rules first': false,
    'Counter Rules first': false,
    Alphabetical: false,
  };

  function me(selection) {
    selection.selectAll('text.label')
      .data(d => [d])
      .join('text')
      .classed('label', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', FONT_SIZE)
      .attr('dy', '1em')
      .attr('dx', '0.5em')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .text('ORDER BY:');

    selection.selectAll('text.orderBy')
      .data(Object.keys(orderByOptions))
      .join('text')
      .classed('orderBy', true)
      .attr('x', (d, i) => (Math.floor(i / 2) * RULES_COLUMN_WIDTH) / 2)
      .attr('y', (d, i) => ((i % 2) * FONT_SIZE * 1.5) + SINGLE_FEATURE_HEIGHT)
      .attr('font-size', FONT_SIZE)
      .attr('dy', '-0.25em')
      .attr('dx', '0.5em')
      .attr('fill', FTTemplate.TEXT_COLOR)
      .attr('font-weight', d => (orderByOptions[d] ? 900 : 400))
      .text(d => d)
      .style('cursor', 'pointer')
      .on('click', (d) => {
        const selectedKey = d3.select(d.target).datum();
        Object.keys(orderByOptions).forEach((key) => {
          orderByOptions[key] = key === selectedKey;
        });
        dispatcher.call('changeOrder', null, selectedKey);
      });

    selection.selectAll('line.horizontalLine')
      .data([0, 1, 2, 3])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', 0)
      .attr('y1', d => (d * FONT_SIZE * 1.5))
      .attr('x2', RULES_COLUMN_WIDTH)
      .attr('y2', d => (d * FONT_SIZE * 1.5))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);

    selection.selectAll('line.verticalLine')
      .data(d => [d])
      .join('line')
      .classed('verticalLine', true)
      .attr('x1', RULES_COLUMN_WIDTH / 2)
      .attr('y1', FONT_SIZE * 1.5)
      .attr('x2', RULES_COLUMN_WIDTH / 2)
      .attr('y2', FONT_SIZE * 3 * 1.5)
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

    gMenu.selectAll('rect.classification')
      .data(d => [d])
      .join('rect')
      .classed('classification', true)
      .attr('x', GUTTER)
      .attr('y', GUTTER)
      .attr('width', LABELS_COLUMN_WIDTH - GUTTER)
      .attr('height', MENU_HEIGHT - (2 * GUTTER))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');


    // =========================================================
    //                  Labels
    // =========================================================
    const gOrder = gMenu.selectAll('g.distribution')
      .data(d => [d])
      .join('g')
      .classed('distribution', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER}, ${2 * GUTTER})`);
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
    gMenu.selectAll('rect.featureImportance')
      .data([null])
      .join('rect')
      .classed('featureImportance', true)
      .attr('x', ((CRULES_GRID_COLUMN_WIDTH * CRulesList.length) + GUTTER) + (LABELS_COLUMN_WIDTH + GUTTER) +
                  (RULES_COLUMN_WIDTH + GUTTER))
      .attr('y', GUTTER)
      .attr('width', FI_COLUMN_WIDTH)
      .attr('height', MENU_HEIGHT - (2 * GUTTER))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');
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
