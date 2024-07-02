import {
  FI_COLUMN_WIDTH,
  RULES_COLUMN_WIDTH,
  LABELS_COLUMN_WIDTH,
  GUTTER,
  MENU_HEIGHT,
  CRULES_GRID_COLUMN_WIDTH,
  FONT_SIZE, colorSet,
  dispatcher,
} from './constants';

const d3 = require('d3');

const FTTemplate = colorSet.default;

function FiperMenu() {
  let width = 200;
  let height = 500;
  let bandScale = d3.scaleBand();

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

    const CRulesList = selection.datum().counterRules;
    const explanationDescriptor = selection.datum();

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

    gMenu.selectAll('rect.distribution')
      .data(d => [d])
      .join('rect')
      .classed('distribution', true)
      .attr('x', LABELS_COLUMN_WIDTH + GUTTER)
      .attr('y', GUTTER)
      .attr('width', RULES_COLUMN_WIDTH)
      .attr('height', MENU_HEIGHT - (2 * GUTTER))
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('fill', 'none');

    const menuCRules = gMenu.selectAll('g.cRuleGrid')
      .data(d => [d])
      .join('g')
      .classed('cRuleGrid', true)
      .attr('transform', `translate(${LABELS_COLUMN_WIDTH + GUTTER + RULES_COLUMN_WIDTH + GUTTER}, ${GUTTER})`);

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

    const gcRuleGrid = menuCRules;
    const gcRuleButtons = gcRuleGrid.selectAll('g.counterRule')
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

  // eslint-disable-next-line
  me.bandScale = function (_) {
    if (!arguments.length) return bandScale;
    bandScale = _;
    return me;
  };

  return me;
}

export default FiperMenu;
