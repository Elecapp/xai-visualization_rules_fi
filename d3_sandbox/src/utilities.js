const d3 = require('d3');
const { GUTTER, LABELS_COLUMN_WIDTH, RULES_COLUMN_WIDTH, FI_COLUMN_WIDTH } = require('./constants');

function allOccurences(text, search) {
  const indexes = [];
  let i = -1;
  i = text.indexOf(search, i + 1);
  while (i !== -1) {
    indexes.push(i);
    i = text.indexOf(search, i + 1);
  }
  return indexes;
}

function text2tspan(text, width, x = 0) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = `${currentLine} ${word}`;
    const testLength = testLine.replace(/_\*|\*_/g, '').length;
    if (testLength > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);

  // check that each line in lines contains the string '_*' and '*_'
  const formatLines = lines.map((l) => {
    let cl = l;
    // find all indexes of the occurences of string '_*'
    let startIndexes = allOccurences(cl, '_*');
    let endIndexes = allOccurences(cl, '*_');

    if (startIndexes.length > endIndexes.length) {
      cl = `${l}*_`;
    }

    if (startIndexes.length < endIndexes.length) {
      cl = `_*${l}`;
    }
    startIndexes = allOccurences(cl, '_*');
    endIndexes = allOccurences(cl, '*_');

    // simple case when length of start and end indexes is the same and it is even
    if (startIndexes.length === endIndexes.length) {
      const l2 = cl.split('');
      startIndexes.forEach((s, i) => {
        l2[s + 1] = '';
        l2[s] = '<tspan font-weight="500">';
        l2[endIndexes[i]] = '</tspan>';
        l2[endIndexes[i] + 1] = '';
      });
      return l2.join('');
    }


    return l;
  });


  // join lines with tspan elements
  return formatLines.map((line, i) => `<tspan x="${x}" dy="${i ? '1.2em' : 0}" >${line}</tspan>`).join('');
}

function predicate2text(adjmatrix, values, ruleSelector, prefix = '') {
  const format = d3.format('.2f');
  if (!adjmatrix) {
    const fPredicate = values[0].predicates[ruleSelector];
    if (fPredicate.length >= 1) {
      return `${prefix} To obtain class _*${fPredicate[0].consequent_class}*_, this feature _*should have*_ a value between _*${format(fPredicate[0].interval[0])} and ${format(fPredicate[0].interval[1])}*_`;
    }
  } else {
    const vPredicates = values.map(v => ({
      preds: v.predicates[ruleSelector], rname: v.rname, cvalue: v.eda.category,
    }));
    const vpPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 1);
    const vnPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 0);

    if (vpPredicates.length === 1) {
      return `${prefix} To obtain class _*${vpPredicates[0].preds.consequent_class}*_, the feature _*should have*_ value _*${vpPredicates[0].cvalue}*_`;
    }
    const negativePredicates = vnPredicates.length;
    if (negativePredicates === 0) {
      return 'Mha!!!';
    }
    if (negativePredicates === 1) {
      return `${prefix} To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should NOT have*_ the value _*${vnPredicates[0].cvalue}*_`;
    }

    return `${prefix} To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should have*_ the values _*${vpPredicates.map(v => v.cvalue).join(', ')}*_`;
  }
  return '';
}

function ColumnLayout() {
  const columns = [
    // this array will contain the configuration of each column, something like
    // {
    //   'column1': {
    //     'name': 'column1',
    //     'width': 100,
    //     'x': 0,
    //   },
  ];

  const columnNames = {
    // 'column1': 0,
  };

  let spacing = 10; // spacing between columns

  function me() {

  }

  // eslint-disable-next-line func-names
  me.addColumn = function (columnName, width) {
    const newColumn = {
      width,
      x: 0,
      name: columnName,
    };
    // compute the x position of the new column on the basis of the previous columns
    if (columns.length > 0) {
      newColumn.x = columns[columns.length - 1].x + columns[columns.length - 1].width + spacing;
    } else {
      newColumn.x = spacing;
    }
    columns.push(newColumn);
    columnNames[columnName] = columns.length - 1;

    return me;
  };

  // eslint-disable-next-line func-names
  me.spacing = function (_) {
    if (!arguments.length) return spacing;
    spacing = _;
    return me;
  };

  // eslint-disable-next-line func-names
  me.dimensions = function (columnName) {
    if (columnName in columnNames) {
      return columns[columnNames[columnName]];
    }
    return null;
  };

  // eslint-disable-next-line func-names
  me.setWidth = function (columnName, width) {
    if (columnName in columnNames) {
      columns[columnNames[columnName]].width = width;
      // update the x position of the columns after the one that has been resized
      for (let i = columnNames[columnName] + 1; i < columns.length; i += 1) {
        columns[i].x = columns[i - 1].x + columns[i - 1].width + spacing;
      }
    }
    return me;
  };

  return me;
}

// setting the columns dimensions
// the handler of the columns
const columnLayout = ColumnLayout();
columnLayout.spacing(GUTTER);
columnLayout.addColumn('feature-handler', 20);
columnLayout.addColumn('feature-labels', LABELS_COLUMN_WIDTH);
columnLayout.addColumn('feature-values', RULES_COLUMN_WIDTH);
columnLayout.addColumn('crule-grid', 10);
columnLayout.addColumn('feature-importance', FI_COLUMN_WIDTH);


module.exports = {
  text2tspan, predicate2text, columnLayout,
};
