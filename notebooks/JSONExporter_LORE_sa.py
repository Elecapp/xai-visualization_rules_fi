import random

import pandas as pd
import numpy as np
import shap

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from lore_sa.neighgen import GeneticGenerator


from dataset import TabularDataset
from neighgen import genetic
from encoder_decoder import ColumnTransformerEnc
from lore import Lore
from surrogate import DecisionTreeSurrogate

from lore_sa.bbox import sklearn_classifier_bbox

from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.pipeline import make_pipeline
from sklearn.compose import make_column_selector


import json


import os

from plot_explanation import PlotExplanation

path = os.getcwd()

def load_data_from_csv(class_field, number_of_dataset):
    datasets = ['titanic_c.csv','german_credit.csv','abalone.csv','iris.csv']


    source_file = f'../datasets/{datasets[number_of_dataset]}'
    # Load and transform dataset
    df = pd.read_csv(source_file, skipinitialspace=True, na_values='?', keep_default_na=True)
    if class_field == "Rings":
        df['Rings'] = pd.cut(df['Rings'],
                             bins=[-np.inf, 8, 10, np.inf],
                             labels=['young', 'medium', 'old'])
    df_prep = df.drop(columns=[class_field])
    num_indices = [df_prep.columns.get_loc(col) for col in df_prep.select_dtypes(include=[np.number]).columns]
    cat_indices = [df_prep.columns.get_loc(col) for col in df_prep.select_dtypes(exclude=[np.number]).columns]



    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(),num_indices), #adapts to different dataset
        ('cat',OrdinalEncoder(), cat_indices)
    ])

    return df, preprocessor, class_field



def train_model(df, preprocessor, class_field):
    model = make_pipeline(preprocessor, RandomForestClassifier(n_estimators=100, random_state=42))
    X = df.drop(columns=[class_field]).values  # Select all features except target
    y = df[class_field].values

    X_train, X_test, y_train, y_test = train_test_split(X, y,
                                                        test_size=0.3, random_state=42, stratify=df[class_field].values)
    model.fit(X_train, y_train)

    return model, X_test, X_train


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


def select_and_explain_instance(number_of_dataset,class_field,bbox, X_train, X_test):
    datasets = ['titanic_c.csv', 'german_credit.csv', 'abalone.csv', 'iris.csv']
    source_file = f'../datasets/{datasets[number_of_dataset]}'
    dataset = TabularDataset.from_csv(source_file, class_name=class_field)
    dataset.df.dropna(inplace=True)
    dataset.update_descriptor()
    enc = ColumnTransformerEnc(dataset.descriptor)
    generator = GeneticGenerator(bbox=bbox, dataset=dataset, encoder=enc, ocr=0.1)
    surrogate = DecisionTreeSurrogate()
    tabularLore = Lore(bbox, dataset, enc, generator, surrogate)

    instance = X_test[0]
    #neighbour = generator.generate(instance,200,dataset.descriptor,)
    l_exp= tabularLore.explain(instance)
    print(l_exp)


    model = bbox.named_steps['randomforestclassifier']
    preprocessor = bbox.named_steps['columntransformer']

    X_train_prep = preprocessor.transform(X_train)
    X_test_prep = preprocessor.transform(X_test)

    s_explainer = shap.TreeExplainer(model, X_train_prep)
    observation = preprocessor.transform(instance.reshape(1, -1))
    shap_values = s_explainer.shap_values(observation)


    predicted_class = bbox.predict(instance.reshape(1, -1))
    predicted_proba = bbox.predict_proba(instance.reshape(1, -1))

    ## Feature Importance Explanation

    #l_exp = l_explnr.explain(inst)
    l_expDict = l_exp.expDict
    # remove key dt from expDict
    l_expDict.pop('dt', None)
    crules = l_expDict['crules']
    if len(crules) > 0:
        print('Lore crules', len(crules), 'instance', inst_num)

    pe = PlotExplanation(
        feature_names=df.columns.tolist(),
        real_feature_names=real_feature_names,
        instance_number=inst_num,
        x_train=X_train,
        expDict=l_expDict,
        feature_importance_type='shap',
        feature_importance=shap_values,
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

    return instance, len(crules)



if __name__ == '__main__':
    # inst_num = 2
    # inst, num_crules = select_and_explain_instance(inst_num, l_explainer, s_explainer,'../d3_sandbox/static')
    # print(f'Instance {inst_num} explained with {num_crules} counter rules')
    # print(f'Files saved in {path}')



    number_of_dataset = 3  # Select the dataset index (0 for Titanic, 1 for German Credit, etc.)
    class_field = "variety"  # Select the proper class field for the dataset
    folder = "iris_explanations" #Select the folder to save the result
    sample_length = 1  # Number of instances to explain
    df, preprocessor, class_field = load_data_from_csv(class_field, number_of_dataset)
    model, X_test, X_train =  train_model(df, preprocessor, class_field)

    instance = select_and_explain_instance(number_of_dataset, class_field, model, X_train, X_test)