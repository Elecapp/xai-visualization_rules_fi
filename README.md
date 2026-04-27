# TRACE Interface

**TRACE** (Tabular Rule-based Augmented Counterfactual Explorer) is a visual analytics interface designed to explain the decision-making processes of AI models on tabular data. It shows the contribution of each feature in relation to the data distribution, facilitating the interpretation of model predictions through:

- **Rules** *(Yellow Indicators)*: Sequences of conditions (predicates) that explain *why* a decision was made on a local instance.
- **Counter-rules** *(Purple Indicators)*: Indications of what changes in the input features would lead to a *different* predicted outcome.
- **Feature Relevance**: Measures of how much each feature contributes to the decision-making process, displayed as importance bars on the right side of the view.

To generate explanations, TRACE integrates the **LORE (Local Rule Explanator)** algorithm — a model-agnostic method that analyzes the behavior of any opaque black-box model by generating a synthetic neighborhood of data to build a transparent surrogate decision tree. This process extracts:
- **Rules**: Sequences of conditions (predicates) that explain why a decision was made on a local instance.
- **Counter-rules**: Indications of what variations in the input features would lead to a different predicted outcome.
- **Feature Relevance**: Measures of how much each feature contributes to the decision-making process.

> 📖 LORE reference: [DOI 10.1007/s10618-022-00878-5](https://link.springer.com/article/10.1007/s10618-022-00878-5)

### Interface Layout

The interface follows a **progressive disclosure workflow** navigable via colored dots or arrows in the top-left menu corner.

**Key visual elements:**
1. **Rules (Yellow)** – Conditions under which the current classification holds.
2. **Counter-rules (Purple)** – Changes required to obtain an alternative classification.
3. **Distributions** – Kernel density curves for numerical features (with a vertical line marking the current instance); stacked bar charts for categorical features.
4. **Feature Importance Bars** – Sortable bars on the right side, indicating each feature's importance to the prediction.

**Customization (Menu Panel):**
- 🛈 **Walkthrough Tutorial**: View punctual information about each section by clicking the Info button and navigating with the arrows.
- **Color Themes**: Switch between Light and Dark mode using the intuitive icons.
- **Accessibility**: A dedicated color-blind-friendly palette is available to ensure clear differentiation of all interface elements.

### Included Datasets (Demo)
- [Abalone](https://archive.ics.uci.edu/dataset/1/abalone) – Predicting sex of abalone (male, female, infant)
- [German Credit](https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data) – Predicting credit risk (good or bad)
- [Iris](https://archive.ics.uci.edu/dataset/53/iris) – Predicting iris species (setosa, versicolor, virginica)

### Heuristic Evaluation

TRACE is currently undergoing a heuristic evaluation to assess usability. The evaluation focuses on how well the interface adheres to **Nielsen's 10 Usability Heuristics**. Participants can:
- [Explore the interface](viewer.html) by navigating through different instances and datasets.
- [Take the survey](https://docs.google.com/forms/d/e/1FAIpQLSdg6ZiC2emb1zsjrCiWez8vzyCbWoiJ_uoe7OQ6CzpBE5454Q/viewform) to provide usability feedback.

> **Disclaimer:** This interface and its related study materials are part of an ongoing research work and are currently under paper submission.  
> **Interface version:** Release Candidate 0.1

---

## D3 Sandbox

The `d3_sandbox/` folder contains the frontend implementation of the TRACE interface, built with [D3.js](https://d3js.org/) and [Vite](https://vite.dev/).

### Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0

### Running the D3 Sandbox

```bash
# 1. Navigate to the sandbox folder
cd d3_sandbox

# 2. Install dependencies
npm install

# 3. Start the development server with hot reload (served at http://localhost:5173 by default)
npm run dev

# 4. (Optional) Build for production
npm run build

# 5. (Optional) Preview the production build locally
npm run preview
```

After running `npm run dev`, open your browser at the URL shown in the terminal (typically `http://localhost:5173`) to explore the TRACE interface.

---

## Research Team

| Name | Role |
|------|------|
| **Salvatore Rinzivillo** | Researcher |
| **Daniele Fadda** | Researcher |
| **Eleonora Cappuccio** | Researcher |

**Affiliation:** Institute of Information Science and Technologies (ISTI), National Research Council of Italy (CNR), Pisa, Italy.
