const abaloneInstances = [
  1, 10, 52, 82, 113, 399, 476, 530, 558, 621, 705, 733,
  788, 795, 829, 861, 976, 995, 1020, 1047, 1059, 1181, 1194,
];

const germanInstances = Array.from({ length: 300 }, (_, index) => index).concat([583]);

const irisInstances = [2, 24, 26];

function buildDatasetEntries(datasetLabel, basePath, ids) {
  return ids.map((id) => ({
    label: `${datasetLabel} - Instance ${id}`,
    value: `${basePath}/instance_${id}.json`,
  }));
}

export const instanceCatalog = [
  {
    label: 'Abalone',
    options: buildDatasetEntries('Abalone', '/static/abalone_explanations', abaloneInstances),
  },
  {
    label: 'German',
    options: buildDatasetEntries('German', '/static/german_explanations', germanInstances),
  },
  {
    label: 'Iris',
    options: buildDatasetEntries('Iris', '/static/iris_explanations', irisInstances),
  },
];

export function flattenInstanceOptions(catalog) {
  return catalog.flatMap((dataset) => dataset.options);
}
