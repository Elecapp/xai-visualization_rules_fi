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

let FTTemplate = colorSet.default;

function FiperMenuCRule() {
  let bandScale = d3.scaleBand();
  let width = 200;
  bandScale.padding(0.1);

  function me(selection) {
    const explanationDescriptor = selection.datum();

    bandScale.domain(explanationDescriptor.counterRules);
    bandScale.range([0, explanationDescriptor.counterRules.length * CRULES_GRID_COLUMN_WIDTH]);

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
      .attr('width', bandScale.bandwidth())
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
      .attr('x', bandScale.bandwidth() / 2)
      .attr('y', (MENU_HEIGHT / 3) * 2)
      .attr('text-anchor', 'middle')
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

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    bandScale.range([0, width]);
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
        // if (key !== selectedKey) {
        //   filterByOptions[key] = false;
        // }
        if (key === selectedKey) {
          filterByOptions[key] = !filterByOptions[key];
        }
      });
      dispatcher.call('changeFilter', null, filterByOptions);
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

function FiperClassificationBox() {
  let width = 200;

  function me(selection) {
    selection.selectAll('rect.classification')
      .data(d => [d])
      .join('rect')
      .classed('classification', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', MENU_HEIGHT)
      .attr('fill', `${FTTemplate.SECONDARY_BACKGROUND_COLOR}`);

    selection.selectAll('line.horizontalLine')
      .data([1])
      .join('line')
      .classed('horizontalLine', true)
      .attr('x1', GUTTER)
      .attr('y1', d => d * SINGLE_FEATURE_HEIGHT)
      .attr('x2', width - (2 * GUTTER))
      .attr('y2', d => d * SINGLE_FEATURE_HEIGHT)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5);

    selection.selectAll('text.classification')
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
    const pprobaBars = FiperMenuClassesBarChart().width(width - GUTTER)
      .height(SINGLE_FEATURE_HEIGHT / 2);
    selection.selectAll('text.pproba')
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

    selection.selectAll('g.pproba')
      .data(d => [d])
      .join('g')
      .classed('pproba', true)
      .attr('transform', `translate(${GUTTER / 2}, ${(SINGLE_FEATURE_HEIGHT * 2)})`)
      .call(pprobaBars);
  }

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  return me;
}

function FiperMenuColumnTitles() {
  function me(selection) {
    // horizontal separator lines
    const titleDescriptor = selection.datum();
    const { labels, widthColumn, CRulesList } = titleDescriptor;

    selection.selectAll('line.separator')
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

    selection.selectAll('line.horizontalLine')
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

    selection.selectAll('rect.padding')
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
    selection.selectAll('text.label')
      .data(labels)
      .join('text')
      .classed('label', true)
      .attr('x', (d, i) =>
        // eslint-disable-next-line max-len,no-mixed-operators
        (widthColumn.slice(0, i).reduce((a, b) => a + b, 0) + (GUTTER * i) + (widthColumn[i] / 2)),
      )
      .attr('y', SINGLE_FEATURE_HEIGHT / 2)
      .attr('font-size', FONT_SIZE)
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
  }

  return me;
}

function FiperMenuPaletteSelector() {
  let width = 200;
  const paletteOptions = [
    {
      name: 'Light',
      value: 'default',
      color: colorSet.default.RULE_COLOR,
      icon: 'M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' +
        'M7.25 0h1.5v3h-1.5zM7.25 13h1.5v3h-1.5zM0 7.25h3v1.5H0zM13 7.25h3v1.5h-3z' +
        'M2.22 2.22l2.12 2.12-1.06 1.06-2.12-2.12zM11.66 11.66l2.12 2.12-1.06 1.06-2.12-2.12z' +
        'M2.22 13.78l2.12-2.12 1.06 1.06-2.12 2.12zM11.66 4.34l2.12-2.12 1.06 1.06-2.12 2.12z',
    },
    {
      name: 'Dark',
      value: 'darkModeColorPalette',
      color: colorSet.darkModeColorPalette.RULE_COLOR,
      icon: 'M8 0c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM8 15c-3.9 0-7-3.1-7-7 0-2.4 1.2-4.6 3.2-5.9-0.1 0.6-0.2 1.3-0.2 1.9 0 4.9 4 8.9 8.9 9-1.3 1.3-3 2-4.9 2z',
    },
    {
      name: 'ColorBlind',
      value: 'grayscaleHighContrast',
      color: colorSet.grayscaleHighContrast.RULE_COLOR,
      icon: 'M2.929,1.405l-1.178,1.178,3.26,3.26c-.187.446-.323.918-.383,1.417-1.756.896-2.96,2.717-2.96,4.823,0,2.992,2.425,5.417,5.417,5.417,1.075,0,2.074-.317,2.917-.857.842.54,1.842.857,2.917.857,1.069,0,2.063-.312,2.902-.848l1.841,1.841,1.178-1.178L2.929,1.405ZM9.276,10.109l1.805,1.805c-.347.098-.703.169-1.081.169-.431,0-.838-.084-1.229-.206.032-.64.218-1.235.505-1.768ZM7.083,7.917l1.273,1.273c-.397.624-.677,1.329-.792,2.092-.992-.719-1.647-1.86-1.712-3.16.391-.122.798-.206,1.229-.206h0ZM7.083,16.25c-2.297,0-4.167-1.869-4.167-4.167,0-1.387.687-2.608,1.732-3.367.262,1.761,1.367,3.243,2.895,4.023.142,1.17.657,2.222,1.422,3.04-.567.291-1.202.47-1.882.47h0ZM8.929,13.227c.346.069.704.107,1.071.107s.724-.038,1.071-.107c-.201.699-.565,1.328-1.071,1.825-.505-.497-.869-1.126-1.071-1.825ZM12.917,16.25c-.681,0-1.314-.18-1.882-.47.663-.708,1.121-1.599,1.328-2.583l2.534,2.534c-.588.327-1.26.519-1.981.519ZM10,3.75c1.898,0,3.487,1.284,3.987,3.023-.346-.069-.704-.107-1.071-.107-.702,0-1.365.147-1.979.39l.988.988c.317-.082.648-.128.991-.128.431,0,.838.084,1.229.206-.03.607-.193,1.177-.455,1.687l.922.922c.369-.605.63-1.283.739-2.014,1.045.758,1.733,1.98,1.733,3.367,0,.342-.053.67-.132.988l1,1c.243-.616.382-1.285.382-1.988,0-2.107-1.205-3.927-2.96-4.823-.325-2.681-2.604-4.76-5.373-4.76-1.035,0-2.002.291-2.824.795l.924.924c.569-.297,1.212-.47,1.9-.47h0Z',
    },
  ];

  function me(selection) {
    selection.selectAll('path.icon')
      .data(paletteOptions)
      .join('path')
      .classed('icon', true)
      .attr('d', d => d.icon)
      .attr('transform', (d, i) => `translate(2, ${(i * SINGLE_FEATURE_HEIGHT) + GUTTER + 3})`)
      .attr('fill', FTTemplate.OTHER_TEXT_COLOR);

    selection.selectAll('rect.palette')
      .data(paletteOptions)
      .join('rect')
      .classed('palette', true)
      .attr('x', 0)
      .attr('y', (d, i) => (i * SINGLE_FEATURE_HEIGHT) + GUTTER)
      .attr('width', SINGLE_FEATURE_HEIGHT * 0.75)
      .attr('height', SINGLE_FEATURE_HEIGHT * 0.75)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.001)
      .attr('stroke', FTTemplate.TEXT_COLOR)
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('click', (d) => {
        const selectedPalette = d3.select(d.target).datum();
        FTTemplate = colorSet[selectedPalette.value];
        dispatcher.call('changePalette', null, selectedPalette);
      });
  }

  // eslint-disable-next-line func-names
  me.width = function (_) {
    if (!arguments.length) return width;
    width = _;
    return me;
  };

  return me;
}

function FiperMenu() {
  let width = 200;
  let height = 500;
  const menuOrderBy = FiperMenuOrderBy();
  const menuCRulesCall = FiperMenuCRule();
  const menuFilterBy = FiperMenuFilterBy();
  const menuClassification = FiperClassificationBox()
    .width(LABELS_COLUMN_WIDTH - SINGLE_FEATURE_HEIGHT - GUTTER);
  const menuColumnTitles = FiperMenuColumnTitles();
  const menuPaletteSelector = FiperMenuPaletteSelector().width(SINGLE_FEATURE_HEIGHT + GUTTER);

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

    // =========================================================
    //                  Classification Box
    // =========================================================
    const classificationRect = gMenu.selectAll('g.classification')
      .data(d => [d])
      .join('g')
      .classed('classification', true)
      .attr('transform', `translate(${GUTTER}, ${GUTTER})`);
    classificationRect.call(menuClassification);
    // =========================================================


    // =========================================================
    //                  Visualization blocks titles
    // =========================================================
    const labels = ['Feature', 'Feature Distribution', 'C.Rules', 'F.I.'];
    const widthColumn = [
      LABELS_COLUMN_WIDTH,
      RULES_COLUMN_WIDTH,
      ((CRulesList.length) * CRULES_GRID_COLUMN_WIDTH),
      FI_COLUMN_WIDTH,
    ];
    const titleDescriptor = {
      labels,
      widthColumn,
      CRulesList,
    };

    const gTitles = selection.selectAll('g.titles')
      .data(d => [d])
      .join('g')
      .classed('titles', true)
      .attr('transform', `translate(${GUTTER}, ${MENU_HEIGHT + (SINGLE_FEATURE_HEIGHT)})`);

    gTitles.datum(titleDescriptor).call(menuColumnTitles);
    // =========================================================

    // =========================================================
    //                  Palette Selector
    // =========================================================
    const gPalette = gMenu.selectAll('g.palette')
      .data(d => [d])
      .join('g')
      .classed('palette', true)
      .attr('transform', `translate(${menuClassification.width() + GUTTER}, ${GUTTER})`);
    gPalette.call(menuPaletteSelector);


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

  return me;
}

export default FiperMenu;
