from lore_sa.bbox import AbstractBBox
import pandas as pd
import numpy as np

from lore_sa.dataset import TabularDataset
from lore_sa.encoder_decoder import TabularEnc, LabelEnc, OneHotEnc
from lore_sa.neighgen.random import RandomGenerator
from lore_sa.surrogate import DecisionTreeSurrogate

class Lore(object):

    def __init__(self, bbox: AbstractBBox):
        """
        LOREM Explainer for tabular data.
        Parameters
        ----------
        bbox [AbstractBBox]:
        """
        super().__init__()
        self.bbox = bbox

    def fit(self, df: pd.DataFrame, class_name, config: dict = None):
        """

        Parameters
        ----------
        df [DataFrame]: tabular dataset
        class_name [str]: column that contains the observed class
        config [dict]: configuration dictionary with the following keys: 'enc_dec','neigh_type','surrogate'

        Returns
        -------

        """
        self.class_name = class_name
        self.dataset = TabularDataset(data=df, class_name=self.class_name)
        self.dataset.df.dropna(inplace=True)
        self.config = config

        # encode dataset
        if self.config is not None and 'enc_dec' in self.config.keys():
            if config['enc_dec'] == 'label':
                self.encoded = LabelEnc(self.dataset.descriptor)
            elif config['enc_dec'] == 'one_hot':
                self.encoded = OneHotEnc(self.dataset.descriptor)
        else:
            self.encoder = TabularEnc(self.dataset.descriptor)

        self.encoded = []
        for x in self.dataset.df.iloc:
            self.encoded.append(self.encoder.encode(x.values))

        self.features = [c for c in self.dataset.df.columns if c != self.dataset.class_name]

    def explain(self, x: np.array):
        # random generation
        if self.config is not None and 'neigh_type' in self.config.keys():
            if self.config['neigh_type'] == 'rndgen':
                gen = RandomGenerator()
        else:
            gen = RandomGenerator()

        self.neighbour = gen.generate(x, 10000, self.dataset.descriptor, onehotencoder=self.encoder)

        # neighbour classification
        self.neighbour.df[self.class_name] = self.bbox.predict(self.neighbour.df[self.features])
        self.neighbour.set_class_name(self.class_name)

        # surrogate
        if self.config is not None and 'surrogate' in self.config.keys():
            if self.config['surrogate'] == 'decision':
                self.surrogate = DecisionTreeSurrogate()
        else:
            self.surrogate = DecisionTreeSurrogate()


        self.surrogate.train(self.neighbour.df[self.features].values, self.neighbour.df['class'])

        self.rule = self.surrogate.get_rule(x, self.neighbour, self.encoder)
        self.crules, self.deltas = self.surrogate.get_counterfactual_rules(x=x, class_name=self.class_name,
                                                                      feature_names=self.features,
                                                                      neighborhood_dataset=self.neighbour,
                                                                      encoder=self.encoder)