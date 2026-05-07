---
name: senior-data-scientist
description: "Statistical modeling, experiment design, causal inference, and predictive analytics. Covers A/B testing, feature engineering, model evaluation with SHAP, and MLflow tracking."
category: "ai"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Senior Data Scientist

World-class senior data scientist skill for production-grade AI/ML/Data systems. May write or edit Python scripts, model configurations, and analysis notebooks.

## Core Workflows

### 1. Design an A/B Test

```python
from scipy import stats
import numpy as np

def calculate_sample_size(baseline_rate, mde, alpha=0.05, power=0.8):
    """Calculate required sample size per variant."""
    p1 = baseline_rate
    p2 = baseline_rate * (1 + mde)
    effect_size = abs(p2 - p1) / np.sqrt((p1*(1-p1) + p2*(1-p2)) / 2)
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)
    return int(np.ceil(((z_alpha + z_beta) / effect_size) ** 2))

def analyze_experiment(control, treatment, alpha=0.05):
    """Run two-proportion z-test and return structured results."""
    p_c = control["conversions"] / control["visitors"]
    p_t = treatment["conversions"] / treatment["visitors"]
    pooled = (control["conversions"] + treatment["conversions"]) / (control["visitors"] + treatment["visitors"])
    se = np.sqrt(pooled * (1 - pooled) * (1/control["visitors"] + 1/treatment["visitors"]))
    z = (p_t - p_c) / se
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))
    ci_low = (p_t - p_c) - stats.norm.ppf(1 - alpha/2) * se
    ci_high = (p_t - p_c) + stats.norm.ppf(1 - alpha/2) * se
    return {"lift": (p_t - p_c) / p_c, "p_value": p_value, "significant": p_value < alpha, "ci_95": (ci_low, ci_high)}
```

**Checklist**: Define ONE primary metric, calculate sample size BEFORE starting, randomize at user level, run for 1+ full business cycle, check sample ratio mismatch, report lift + CI not just p-value, apply Bonferroni for multiple metrics.

### 2. Build a Feature Engineering Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer

def build_feature_pipeline(numeric_cols, categorical_cols):
    numeric_pipeline = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
    categorical_pipeline = Pipeline([("impute", SimpleImputer(strategy="most_frequent")), ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
    return ColumnTransformer([("num", numeric_pipeline, numeric_cols), ("cat", categorical_pipeline, categorical_cols)], remainder="drop")
```

**Checklist**: Never fit on full dataset (fit train, transform test), log-transform skewed features, target-encode high-cardinality categoricals, generate lag/rolling features BEFORE split, document feature business meaning.

### 3. Train, Evaluate, and Select a Model

> See references/statistical_methods_advanced.md for detailed evaluation patterns.

```python
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, roc_auc_score, average_precision_score

SCORERS = {
    "roc_auc": make_scorer(roc_auc_score, needs_proba=True),
    "avg_prec": make_scorer(average_precision_score, needs_proba=True),
}

def evaluate_model(model, X, y, cv=5):
    cv_results = cross_validate(model, X, y, cv=StratifiedKFold(n_splits=cv, shuffle=True, random_state=42), scoring=SCORERS, return_train_score=True)
    summary = {}
    for metric in SCORERS:
        test_scores = cv_results[f"test_{metric}"]
        train_mean = cv_results[f"train_{metric}"].mean()
        summary[metric] = {"mean": test_scores.mean(), "std": test_scores.std(), "overfit_gap": train_mean - test_scores.mean()}
    return summary
```

**Checklist**: Report AUC-PR alongside AUC-ROC for imbalanced data, check overfit_gap >0.05, calibrate probabilities, compute SHAP values, run baseline comparison, log every run to MLflow.

### 4. Causal Inference: Difference-in-Differences

> See references/experiment_design_frameworks.md for full causal inference patterns.

```python
import statsmodels.formula.api as smf

def diff_in_diff(df, outcome, treatment_col, post_col, controls=None):
    covariates = " + ".join(controls) if controls else ""
    formula = f"{outcome} ~ {treatment_col} * {post_col}" + (f" + {covariates}" if covariates else "")
    result = smf.ols(formula, data=df).fit(cov_type="HC3")
    interaction = f"{treatment_col}:{post_col}"
    return {"att": result.params[interaction], "p_value": result.pvalues[interaction], "ci_95": result.conf_int().loc[interaction].tolist()}
```

**Checklist**: Validate parallel trends, use HC3 robust SEs, cluster SEs for panel data, consider propensity score matching, report ATT with CI.

## Reference Documentation

- `references/statistical_methods_advanced.md` - Statistical methods deep dive
- `references/experiment_design_frameworks.md` - Experiment design frameworks
- `references/feature_engineering_patterns.md` - Feature engineering patterns

## Common Commands

```bash
python -m pytest tests/ -v --cov=src/             # Testing
python scripts/train.py --config prod.yaml          # Training
python scripts/evaluate.py --model best.pth          # Evaluation
docker build -t service:v1 . && kubectl apply -f k8s/ # Deployment
```
