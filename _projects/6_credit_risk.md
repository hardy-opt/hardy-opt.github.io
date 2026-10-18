---
layout: page
title: Credit risk classification
description: A self-directed exercise on public UCI credit datasets. End-to-end supervised pipeline with class imbalance handling, cost-sensitive evaluation and model interpretability.
img: assets/img/figures1/model_comparison.png
importance: 9
category: learning
related_publications: false
---

# Credit risk classification

> **A learning project, listed as one.** Built on public UCI datasets to practise an end-to-end
> supervised workflow outside my research area. It is not research, the datasets are standard
> benchmarks, and the results are not novel. It is here because the engineering is honest work and
> it is a fair sample of how I structure a modelling pipeline.

### The task

Two related problems on public data.

**Next-month default prediction.** UCI Taiwan credit card dataset: 30,000 clients, 23 features
covering credit limit, demographics, six months of repayment status, bill amounts and payment
amounts. Binary target: does the client default next month?

**Multi-class risk tiering.** UCI German Credit dataset, extended from its standard binary
good/bad target into a five-tier ordering, which turns it into an ordinal problem where the cost of
an error depends on how far the prediction is from the truth.

### Why accuracy is the wrong metric here

The Taiwan dataset is imbalanced: roughly 22 percent of clients default. A model that predicts
"no default" for everyone scores 78 percent accuracy and is worthless.

Worse, the two error types have very different costs. Approving a client who defaults loses the
outstanding balance. Declining a client who would have repaid loses the margin on that account.
These differ by an order of magnitude, so the right objective is not accuracy but expected cost:

$$
\mathbb{E}[\text{cost}] \;=\; c_{\mathrm{FN}} \cdot P(\text{predict no default} \mid \text{defaults}) \;+\; c_{\mathrm{FP}} \cdot P(\text{predict default} \mid \text{repays})
$$

With an explicit cost matrix, the decision threshold stops being 0.5 and becomes something you
derive. Getting this framing right matters more than the choice of classifier, which is the main
thing the project taught me.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures1/model_comparison.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">Model comparison across the metrics that matter for an asymmetric-cost problem.</div>

### What the pipeline does

**Exploratory analysis and feature engineering.** Repayment status across six months is the
strongest single signal, and the engineered features that help most are derived from it: payment
ratios, trend in repayment delay, utilisation of the credit limit.

**Class imbalance.** SMOTE, class weighting, and a reweighted baseline, compared against each
other rather than assumed.

**Categorical encoding.** Target, one-hot and ordinal encodings compared, which matters more than
expected for the tree ensembles.

**Models.** Logistic regression with L1 and L2 regularization, random forest, XGBoost, and a
stacked ensemble.

**Evaluation.** Stratified cross-validation, ROC and precision-recall curves per class, and the
cost-sensitive metric above. Precision-recall is the informative curve on an imbalanced problem;
ROC flatters every model.

**Interpretability.** SHAP values for global and per-prediction attribution, and per-class feature
importance for the multi-class variant. For a credit decision this is not optional, because an
applicant is entitled to a reason.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures4/ensemble_roc_curves.png" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures4/ensemble_feature_importance.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">Ensemble ROC curves per class, and the feature importances behind them.</div>

### Honest assessment

Standard methods on standard datasets. The UCI leaderboards for both are well established and
nothing here beats them. What the project demonstrates is pipeline construction, sensible
evaluation design for an asymmetric-cost problem, and reading a model rather than only scoring it.

I keep it visible and labelled rather than deleting it, because an accurate description of a
practice project is worth more than an inflated one.

### Code

- [`hardy-opt/next-month-default-predictor`](https://github.com/hardy-opt/next-month-default-predictor)
- [`hardy-opt/multiclass-credit-risk-classifier`](https://github.com/hardy-opt/multiclass-credit-risk-classifier)
