from lore_sa.neighgen.neighborhood_generator import NeighborhoodGenerator

from lore_sa.dataset.tabular_dataset import TabularDataset
import pandas as pd
import numpy as np

__all__ = ["NeighborhoodGenerator", "RandomGenerator"]


class RandomGenerator(NeighborhoodGenerator):
    """
    Random Generator creates neighbor instances by generating random values starting from the instance to explain
    """

    def __init__(self):
        self.generated_data = None

    def generate(self, x, num_instances, descriptor, onehotencoder=None):
        """
        random generation of new instances. The starting instance x is only used to detect the value type of each feature, in order
        to generate new values only for numeric features.

        :param x[dict]: the starting instance from the real dataset
        :param num_instances[int]: the number of instances to generate
        :param descriptor[dict]: data descriptor as generated from a Dataset object
        :param onehotencoder[EncDec]: the onehotencoder eventually to encode the instance
        The list (or range) associated to each key is used to randomly choice an element within the list.

        :return [TabularDataset]: a tabular dataset instance with the new data generated
        """

        generated_list, columns = [], []

        columns = [None for e in range(len(x))]
        for n in range(num_instances):
            instance = [None for e in range(len(x))]

            for name, feature in descriptor['categorical'].items():
                if onehotencoder is not None:
                    # feature is encoded, so i need to random generate chunks of one-hot-encoded values

                    # finding the vector index of the feature
                    indices = [k for k, v in onehotencoder.get_encoded_features().items() if v.split("=")[0] == name]
                    index_choice = np.random.choice(list(range(len(indices))))

                    for i, idx in enumerate(indices):
                        if i == index_choice:
                            instance[idx] = 1
                        else:
                            instance[idx] = 0
                        columns[idx] = onehotencoder.get_encoded_features()[idx]


                else:
                    # feature is not encoded: random choice among the distinct values of the feature

                    instance[feature['index']] = np.random.choice(feature['distinct_values'])
                    columns[feature['index']] = name

            for name, feature in descriptor['numeric'].items():
                idx = None
                if onehotencoder is not None:
                    idx = [k for k, v in onehotencoder.get_encoded_features().items() if v == name][0]
                else:
                    idx = feature['index']
                columns[idx] = name

                instance[idx] = np.random.uniform(low=feature['min'], high=feature['max'])

            generated_list.append(instance)

        self.generated_data = generated_list

        return TabularDataset(pd.DataFrame(generated_list, columns=columns))
