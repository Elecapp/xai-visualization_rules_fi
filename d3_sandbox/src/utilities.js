const d3 = require('d3');

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
    // find all indexes of the occurences of string '_*'
    let startIndexes = allOccurences(l, '_*');
    let endIndexes = allOccurences(l, '*_');

    if (startIndexes.length > endIndexes.length) {
      endIndexes = allOccurences(`${l}*_`, '*_');
      startIndexes = allOccurences(l, '_*');
    }

    if (startIndexes.length < endIndexes.length) {
      startIndexes = allOccurences(`_*${l}`, '_*');
      endIndexes = allOccurences(l, '*_');
    }

    // simple case when length of start and end indexes is the same and it is even
    if (startIndexes.length === endIndexes.length) {
      const l2 = l.split('');
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
  return formatLines.map((line, i) => `<tspan x="${x}" dy="${i ? '1.2em' : 0}">${line}</tspan>`).join('');
}

function predicate2text(adjmatrix, values, ruleSelector) {
  const format = d3.format('.2f');
  if (!adjmatrix) {
    const fPredicate = values[0].predicates[ruleSelector];
    if (fPredicate.length >= 1) {
      return `To obtain class _*${fPredicate[0].consequent_class}*_, this feature _*should have*_ a value between _*${format(fPredicate[0].interval[0])} and ${format(fPredicate[0].interval[1])}*_`;
    }
  } else {
    const vPredicates = values.map(v => ({
      preds: v.predicates[ruleSelector], rname: v.rname, cvalue: v.eda.category,
    }));
    const vpPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 1);
    const vnPredicates = vPredicates.filter(v => v.preds && v.preds.exp_value === 0);

    if (vpPredicates.length === 1) {
      return `To obtain class _*${vpPredicates[0].preds.consequent_class}*_, the feature _*should have*_ value _*${vpPredicates[0].cvalue}*_`;
    }
    const negativePredicates = vnPredicates.length;
    if (negativePredicates === 0) {
      return 'Mha!!!';
    }
    if (negativePredicates === 1) {
      return `To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should NOT have*_ the value _*${vnPredicates[0].cvalue}*_`;
    }

    return `To obtain class _*${vnPredicates[0].preds.consequent_class}*_ this feature _*should have*_ the values _*${vpPredicates.map(v => v.cvalue).join(', ')}*_`;
  }
  return '';
}

module.exports = {
  text2tspan, predicate2text,
};
