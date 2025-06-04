import pandas as pd
import numpy as np

class PlotExplanation:
    def __init__(
            self,
            feature_names,
            real_feature_names,
            numeric_columns,
            instance_number,
            x_train,
            expDict,
            feature_importance_type,
            feature_importance
    ):
        self.feature_names = feature_names
        self.real_feature_names = real_feature_names
        self.numeric_columns = numeric_columns
        self.instance_number = instance_number
        self.x_train = x_train
        self.rule = expDict['rule']
        self.crules = expDict['counterfactuals']
        self.expDict = expDict
        self.feature_importance_type = feature_importance_type
        self.feature_importance = feature_importance
        self.df = None

    def prepare_dataframe(self):
        feature_list = []
        if self.feature_importance_type == 'lime':
            lime_dict = {}
            for (key, value) in self.feature_importance:
                lime_dict.setdefault(key, value)
        for i, el in enumerate(self.feature_names):
            f = {}
            if el in self.numeric_columns:
                f['type'] = 'numeric'
                f['name'] = el
                f['rname'] = self.real_feature_names[i]
                if self.x_train is not None:
                    f['min'] = self.x_train[el].min()
                    f['max'] = self.x_train[el].max()
                    f['q1'] = self.x_train[el].quantile(0.25)
                    f['median'] = self.x_train[el].quantile(0.50)
                    f['q3'] = self.x_train[el].quantile(0.75)
                    f['mean'] = self.x_train[el].mean()
                    f['std'] = self.x_train[el].std()
            else:
                f['type'] = 'categorical'
                f['name'] = el
                f['rname'] = el.split('=')[0]
                f['category'] = el.split('=', 1)[1]
                if self.x_train is not None:
                    f['count'] = self.x_train[el].sum()

            if self.feature_importance_type == 'lime':
                f['feature_importance'] = lime_dict[el]
            if self.feature_importance_type == 'shap':
                f['feature_importance'] = self.feature_importance[1][i]
            feature_list.append(f)
        self.df = pd.DataFrame.from_records(feature_list)

        if self.instance_number:
            inst = self.x_train.iloc[self.instance_number].values
            self.df['inst'] = inst
        if self.rule is not None:
            df_rules = pd.DataFrame.from_records(self.rule['premise'])
            self.df = self.df.merge(df_rules, how='left', left_on='name', right_on='att')
            self.df = self.df.drop('att', axis=1)
            thr2_list = []
            for i, row in self.df.iterrows():
                if row['op'] == '>' or row['op'] == '>=':
                    thr2_list.append(row['max'])
                    continue
                if row['op'] == '<' or row['op'] == '<=':
                    thr2_list.append(row['min'])
                    continue
                else:
                    thr2_list.append(np.nan)
            self.df['thr2'] = thr2_list
        self.df.sort_values(by=['feature_importance'], key=lambda x: abs(x), ascending=False, inplace=True)
        return self.df

    def prepare_rule_descriptor(self, inst):
        feature_list = []
        if self.feature_importance_type == 'lime':
            lime_dict = {}
            for (key, value) in self.feature_importance:
                lime_dict.setdefault(key, value)
        for i, el in enumerate(self.feature_names):
            f = {}
            if el in self.numeric_columns:
                f['type'] = 'numeric'
                f['name'] = el
                f['rname'] = self.real_feature_names[i]
                if self.x_train is not None:
                    f['min'] = self.x_train[el].min()
                    f['max'] = self.x_train[el].max()
                    f['q1'] = self.x_train[el].quantile(0.25)
                    f['median'] = self.x_train[el].quantile(0.50)
                    f['q3'] = self.x_train[el].quantile(0.75)
                    f['mean'] = self.x_train[el].mean()
                    f['std'] = self.x_train[el].std()
            else:
                f['type'] = 'categorical'
                f['name'] = el
                f['rname'] = el.split('=')[0]
                f['category'] = el.split('=', 1)[1]
                if self.x_train is not None:
                    f['count'] = self.x_train[el].sum()

            if self.feature_importance_type == 'lime':
                f['feature_importance'] = lime_dict[el]
            if self.feature_importance_type == 'shap':
                f['feature_importance'] = self.feature_importance[1][i]
            feature_list.append(f)
        feature_dict = {}
        # Store data distribution in a dictionary with an entry for each feature
        for f in feature_list:
            f_name= f['name']
            feature_dict[f_name] = {}
            feature_dict[f_name]['name'] = f.pop('name')
            feature_dict[f_name]['rname'] = f.pop('rname')
            feature_dict[f_name]['type'] = f.pop('type')
            feature_dict[f_name]['feature_importance'] = f.pop('feature_importance')
            feature_dict[f_name]['eda'] = f
            feature_dict[f_name]['rule'] = []
            feature_dict[f_name]['crules'] = {}
        # Store the value of the instance in the corresponding entry of the dictionary
        if self.instance_number:
            # inst = self.x_train.iloc[self.instance_number].values
            for i, v in enumerate(inst):
                feat_name = self.feature_names[i]
                feature_dict[feat_name]['instance_value'] = v

        if self.rule is not None:
            for predicate in self.rule['premise']:
                feat_name = predicate['att']
                feature_dict[feat_name]['rule'].append((predicate, self.rule['cons']))

        if len(self.crules) > 0:
            for i, crule in enumerate(self.crules):
                for predicate in crule['premise']:
                    feat_name = predicate['att']
                    if feat_name in feature_dict:
                        if f'C{i}' not in feature_dict[feat_name]['crules']:
                            feature_dict[feat_name]['crules'][f'C{i}'] = []
                        feature_dict[feat_name]['crules'][f'C{i}'].append((predicate, crule['cons']))
        else:
            print("No counter rules found")


        descriptor = {
            'features': list(feature_dict.values()),
            'bb_pred': self.expDict['bb_pred'],
            'dt_pred': self.expDict['dt_pred'],
        }
        return descriptor



        # if self.instance_number:
        #     inst = self.x_train.iloc[self.instance_number].values
        #     self.df['inst'] = inst
        # if self.rules is not None:
        #     df_rules = pd.DataFrame.from_records(self.rules)
        #     self.df = self.df.merge(df_rules, how='left', left_on='name', right_on='att')
        #     self.df = self.df.drop('att', axis=1)
        #     thr2_list = []
        #     for i, row in self.df.iterrows():
        #         if row['op'] == '>' or row['op'] == '>=':
        #             thr2_list.append(row['max'])
        #             continue
        #         if row['op'] == '<' or row['op'] == '<=':
        #             thr2_list.append(row['min'])
        #             continue
        #         else:
        #             thr2_list.append(np.nan)
        #     self.df['thr2'] = thr2_list
        # self.df.sort_values(by=['feature_importance'], key=lambda x: abs(x), ascending=False, inplace=True)
        # return self.df

