from abc import ABC, abstractmethod

__all__ = ["Surrogate"]

import numpy as np

from lore_sa.dataset import Dataset
from lore_sa.encoder_decoder import EncDec


class Surrogate(ABC):
    """
    Generic surrogate class
    """
    def __init__(self, kind = None, preprocessing =None):
        #decision tree, supertree
        self.kind = kind
        #kind of preprocessing to apply
        self.preprocessing = preprocessing

    @abstractmethod
    def train(self, Z, Yb, weights):
        pass

    @abstractmethod
    def get_rule(self, x: np.array, dataset: Dataset, encdec: EncDec = None):
        pass

    @abstractmethod
    def get_counterfactual_rules(self, x: np.array, class_name, feature_names, neighborhood_dataset: Dataset,
                                 features_map_inv=None, multi_label: bool = False, encoder: EncDec = None,
                                 filter_crules=None, constraints: dict = None, unadmittible_features: list = None):
        pass