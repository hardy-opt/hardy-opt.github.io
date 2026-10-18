---
layout: about
title: About
permalink: /
subtitle: Optimization for AI systems. Autonomous experimentation, agentic architectures, neural-guided search, and the algorithms that make them affordable.

profile:
  align: right
  image: Hardik.png
  image_circular: false
  more_info: >
    <p><strong>ML Research Engineer</strong>, MI-6 Ltd., Tokyo</p>
    <p>PhD in Informatics (Mathematical Optimization),<br>Kyoto University</p>
    <p>Kyoto, Japan</p>

selected_papers: true # shows papers marked selected={true} in papers.bib
social: true
announcements:
  enabled: true
  scrollable: true
  limit: 4
---

**I build the decision layer of AI systems: the part that works out what is worth computing,
measuring, or asking next, and then proves it was worth it.**

That question looks different depending on where you stand. In a self-driving laboratory it is
*which experiment should the instrument run next, and can we afford it.* In computer-aided chemistry
it is *which of ten thousand candidate reactions deserves the next expansion.* In a training loop it
is *how much curvature information is worth paying for.* They are the same problem, and I work on
all three.

## What I am building now

I am an ML research engineer at **MI-6 Ltd.** in Tokyo, where I own three concurrent R&D lines.

**Autonomous experimentation.** A closed-loop Bayesian optimization system for self-driving labs,
built so the budget is structural rather than an afterthought: every proposed experiment is priced
by a fitted cost model, charged against a ledger, and refused if the remaining budget cannot cover
it. Twelve proposal policies, three interchangeable acquisition optimizers, architecture decision
records, and a one-command reproducibility check that re-derives every committed figure from
committed data. CNN encoders turn instrument images into surrogate inputs, so the loop learns from
what the instrument actually sees rather than from a scalar proxy.

**Agentic architecture.** A packaged, versioned sub-agent that publishes a data contract to a
separate optimization engine. Determinism is enforced as a test, the module boundary is checked at
process level, and continuous integration gates its own published result counts so they cannot
drift. On top of it I am architecting an **agentic LLM framework with a knowledge ontology** that
makes cost-aware experimental decisions, choosing adaptively between a cheap observation and an
expensive full characterisation inside a multi-fidelity loop.

**Neural-guided search.** Monte Carlo Tree Search and bidirectional A\* over AND/OR graphs for
synthesis planning, with a learned cost-to-go heuristic that cuts exploration at unchanged per-step
compute. First-author conference abstract. [See the projects →](/projects/)

## Where it comes from

My PhD at [Kyoto University](https://www.kyoto-u.ac.jp/en) was on making second-order information
affordable at scale, and I pushed every method through to an application rather than stopping at
the theorem. A regularized L-BFGS method in *Computational Optimization and Applications*. A
Barzilai-Borwein variant of SVRG in *JIMO*. The regularized Nyström curvature line, which reduces
per-iteration cost from $$O(nd^2 + d^3)$$ to $$O(ndm + dm^2)$$ with a sketch of roughly 5 to 20
percent of the feature dimension, and keeps the step a descent direction even when the Hessian is
indefinite.

Those methods went into **brain-MRI tumour classification** with transfer learning, where data is
scarce and getting more out of each gradient actually matters; into **federated learning** on edge
devices, where the Hessian for a ResNet-50 does not fit on the client and a sketch takes the
per-round cost from hours to minutes; and onto high-dimensional classification benchmarks and the
CUTEst collection. [More on the research →](/research/)

## How I work

Experiments designed before they are run. Paired statistical tests rather than single-run deltas. A
stated detection floor beside every comparison. Negative results reported with their mechanism
rather than dropped. Most of the levers you try do not work, and knowing which ones did, and why, is
the job.

**Day to day:** Python, PyTorch, BoTorch and GPyTorch, NumPy and SciPy, pytest and CI, Git, MATLAB,
RDKit. Things I have shipped: packaged libraries with versioned contracts, benchmark harnesses with
thousands of tests, reproducibility checks that fail the build when a figure stops following from
its data.

**Currently interested in** research scientist and research engineer roles where optimization and
decision-making are the substance of the work: AI for science, autonomous experimentation,
industrial R&D, efficient training, and scientific computing.
