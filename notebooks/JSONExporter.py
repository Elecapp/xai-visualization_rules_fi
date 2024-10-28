import random

import pandas as pd
import numpy as np
import xailib.xailib_base

from sklearn import preprocessing
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

from xailib.data_loaders.dataframe_loader import prepare_dataframe

from xailib.explainers.lime_explainer import LimeXAITabularExplainer
from xailib.explainers.lore_explainer import LoreTabularExplainer
from xailib.explainers.shap_explainer_tab import ShapXAITabularExplainer
from lore_explainer.explanation import ExplanationEncoder
from xailib.models.sklearn_classifier_wrapper import sklearn_classifier_wrapper

import altair as alt
import json
import matplotlib.pyplot as plt

import os

from plot_explanation import PlotExplanation

path = os.getcwd()

def load_data_from_csv(class_field, number_of_dataset):
    datasets = ['titanic_c.csv','german_credit.csv','abalone.data']
    source_file = f'../datasets/{datasets[number_of_dataset]}'
    # Load and transform dataset
    df = pd.read_csv(source_file, skipinitialspace=True, na_values='?', keep_default_na=True)
    return df, class_field

def train_model(df, class_field):
    df, feature_names, class_values, numeric_columns, rdf, real_feature_names, features_map = prepare_dataframe(df, class_field)

    test_size = 0.3
    random_state = 42
    X_train, X_test, Y_train, Y_test= train_test_split(df[feature_names], df[class_field],
                                                        test_size=test_size,
                                                        random_state=random_state,
                                                        stratify=df[class_field])

    bb = RandomForestClassifier(n_estimators=30, random_state=42)
    bb.fit(X_train.values, Y_train.values)
    bbox = sklearn_classifier_wrapper(bb)

    s_explainer = ShapXAITabularExplainer(bbox, feature_names)
    config = {'explainer': 'tree', 'X_train': X_train.iloc[0:].values}
    s_explainer.fit(config)


    l_explainer = LoreTabularExplainer(bbox)
    config = {'neigh_type':'geneticp', 'size':100000, 'ocr':0.1, 'ngen':15}
    l_explainer.fit(df, class_field, config)



    return X_test, Y_test, l_explainer, s_explainer,bb, feature_names, numeric_columns,real_feature_names

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.generic):
            return obj.item()  # For other numpy scalar types
        return super(CustomJSONEncoder, self).default(obj)


def select_and_explain_instance(inst_num, l_explnr, s_explnr, path, X_test, Y_test, bb, feature_names,real_feature_names, X_train,numeric_columns):
    inst = X_test.iloc[inst_num].values
    true_class = Y_test.iloc[inst_num]

    # check
    # print('Instance ',inst)
    # print('True class ',Y_test_g.iloc[inst_num])
    # print('Predicted class ',bb.predict(inst.reshape(1, -1)))
    # print('Predicted Probability', probabilities[inst_num])

    predicted_class = bb.predict(inst.reshape(1, -1))
    predicted_proba = bb.predict_proba(inst.reshape(1, -1))

    ## Feature Importance Explanation
    s_exp = s_explnr.explain(inst)
    shap_feature_importance = s_exp.exp
    l_exp = l_explnr.explain(inst)
    l_expDict = l_exp.expDict
    # remove key dt from expDict
    l_expDict.pop('dt', None)
    crules = l_expDict['crules']
    if len(crules) > 0:
        print('Lore crules', len(crules), 'instance', inst_num)

    pe = PlotExplanation(
        feature_names=feature_names,
        real_feature_names=real_feature_names,
        instance_number=inst_num,
        x_train=X_train,
        expDict=l_expDict,
        feature_importance_type='shap',
        feature_importance=shap_feature_importance,
        numeric_columns=numeric_columns
    )
    features = pe.prepare_rule_descriptor(inst)['features']
    # add categorical info
    categorical_features_info = {
        'account_check_status': {
            'is_ordinal': True,
            'order': ['no checking account', '< 0 DM', '0 <= ... < 200 DM',
                      '>= 200 DM / salary assignments for at least 1 year']  # Descendant order
        },
        'credit_history': {
            'is_ordinal': True,
            'order': ['critical account/ other credits existing (not at this bank)', 'delay in paying off in the past',
                      'existing credits paid back duly till now', 'all credits at this bank paid back duly',
                      'no credits taken/ all credits paid back duly']
        },
        'purpose': {
            'is_ordinal': False
        },
        'savings': {
            'is_ordinal': True,
            'order': ['unknown/ no savings account', '... < 100 DM', '100 <= ... < 500 DM', '500 <= ... < 1000 DM ',
                      '.. >= 1000 DM ']
        },
        'present_emp_since': {
            'is_ordinal': True,
            'order': ['unemployed', '... < 1 year ', '1 <= ... < 4 years', '4 <= ... < 7 years', '.. >= 7 years']
        },
        'personal_status_sex': {
            'is_ordinal': False
        },
        'other_debtors': {
            'is_ordinal': False
        },
        'property': {
            'is_ordinal': False
        },
        'other_installment_plans': {
            'is_ordinal': True,
            'order': ['None', 'bank', 'stores']
        },
        'housing': {
            'is_ordinal': True,
            'order': ['rent', 'for free', 'own']
        },

        'job': {
            'is_ordinal': False
        },

        'telephone': {
            'is_ordinal': False
        },
        'foreign_worker': {
            'is_ordinal': False
        },
    }

    for feature_entry in features:
        feature_name = feature_entry.get("rname")
        if feature_entry.get("type") == "categorical" and feature_name in categorical_features_info:
            feature_entry["is_ordinal"] = categorical_features_info[feature_name]["is_ordinal"]
            if feature_entry["is_ordinal"]:
                feature_entry["order"] = categorical_features_info[feature_name]["order"]
    output_data = {
        "features": features,
        "predicted_class": predicted_class[0],
        "true_class": int(true_class),
        "predicted_proba": predicted_proba[0].tolist()
    }

    with open(f'{path}/instance_{inst_num}.json', "w") as outfile:
        json.dump(output_data, outfile, cls=CustomJSONEncoder, indent=4)

    # save the output of l_exp.exp to a text file named instance_{inst_num}_lore.txt
    with open(f'{path}/instance_{inst_num}_lore.txt', "w") as outfile:
        outfile.write(str(l_exp.exp))

    return inst, len(crules)



if __name__ == '__main__':
    # inst_num = 2
    # inst, num_crules = select_and_explain_instance(inst_num, l_explainer, s_explainer,'../d3_sandbox/static')
    # print(f'Instance {inst_num} explained with {num_crules} counter rules')
    # print(f'Files saved in {path}')

    class_field = ""
    folder=""
    number_of_dataset = 1  # Select the dataset index (0 for Titanic, 1 for German Credit, etc.)
    sample_length = 10  # Number of instances to explain
    df, class_field = load_data_from_csv(class_field, number_of_dataset)
    X_test, Y_test, l_explainer, s_explainer, bb, feature_names, numeric_columns, real_feature_names = train_model(df, class_field)
    integer_list = list(range(X_test.shape[0]))
    insts_to_compute = random.sample(integer_list, len(integer_list))
    for inst_num in insts_to_compute:
        print(f'Processing Instance {inst_num}')
        _, ncr = select_and_explain_instance(inst_num, l_explainer, s_explainer, f'../d3_sandbox/static/{folder}')
        num_try = 0
        while (ncr <= 1 and num_try < 5):
            _, ncr = select_and_explain_instance(inst_num, l_explainer, s_explainer, f'../d3_sandbox/static/{folder}')
            num_try += 1