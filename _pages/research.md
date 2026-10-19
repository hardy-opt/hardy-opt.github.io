---
layout: page
permalink: /research/
title: Research
description: Making expensive information affordable. Second-order optimization at high dimension, and sequential decision-making when each experiment has a price.
nav: true
nav_order: 2
toc:
  sidebar: left
---

**Research areas:** Mathematical Optimization · Optimization for Machine Learning ·
Second-Order and Stochastic Methods · Randomized Numerical Linear Algebra · Constrained and
Multi-Objective Bayesian Optimization · Knowledge Representation for Scientific Machine Learning ·
Heuristic Search and Planning for Combinatorial Discovery · Federated and Communication-Efficient
Distributed Optimization

## In one paragraph

My work is about **the cost of information in optimization**, and it has two halves. The first is
mathematical: curvature tells an optimizer far more than a gradient does, and it is usually too
expensive to compute, so the question is how much of it you can buy and at what price. The second is
industrial: in autonomous laboratories and discovery pipelines the expensive quantity is not a matrix
factorisation but an **experiment**, and the same question returns as which measurement is worth
making next, under a budget that can run out. The methods differ. The structure does not.

Below: the doctoral work that established the first half, the current research that pursues the
second, and how I go about both.

## The problem

Training a machine learning model means minimising a loss over parameters. The cheap way is to
follow the gradient: it costs one pass over the data per step, and it is what SGD and Adam do. The
fast way is to use curvature, Newton's method converges quadratically near a solution, because it
knows not just which way is downhill but how the slope is changing.

The difficulty is price. For $$n$$ data points and $$d$$ parameters, forming and inverting the
Hessian costs $$O(nd^2 + d^3)$$ per step. At $$d = 10^4$$ that is already prohibitive; at the scale
of a modern model it is absurd. So in practice almost everyone uses first-order methods and accepts
slower convergence, more tuning, and worse behaviour on ill-conditioned problems.

**My work asks a narrower and more answerable question: how much curvature can you buy, and what is
the least you have to pay for it?**

## Doctoral work: the thesis

[**The Utilization of Second-Order Information for Large-Scale Unconstrained Optimization
Problems**](https://www-optima.amp.i.kyoto-u.ac.jp/papers/doctor/2024_doctor_hardik.pdf)
Kyoto University, Graduate School of Informatics, March 2024.

The three results below are its chapters. If you want the full treatment, with the proofs and the
complete experimental tables, the thesis is the one document that contains all of it.

## Three results

### 1 · Regularized L-BFGS, making line searches cheaper

_[Computational Optimization and Applications 82, 61-88 (2022)](https://doi.org/10.1007/s10589-022-00351-5)_
· with Shinji Sugimoto and Nobuo Yamashita

L-BFGS approximates curvature from a short history of gradients, which is why it is the standard
quasi-Newton method at scale. But its global convergence guarantee relies on a line search, and a
line search costs function evaluations, sometimes a lot of them.

We added a regularization term that lets the method accept steps the line search would otherwise
reject, and proved global convergence under the usual assumptions. We then combined it with a
nonmonotone acceptance rule and simultaneous use of the Wolfe conditions. On the
[CUTEst](https://github.com/ralna/CUTEst) collection the regularized method **solves more problems**
than standard L-BFGS: the honest metric for a general-purpose solver, where robustness matters more
than speed on any single problem.

**Where it does not help:** on well-conditioned problems the extra machinery buys nothing, and the
regularization parameter is one more thing to choose.

### 2 · Regularized Nyström curvature: a sketch instead of a Hessian

_NysReg-Gradient, IEEE IJCNN 2026 (WCCI)_ · with Makoto Yamada and Dinesh Singh
_and [Regularized Nyström Method for Non-Convex Optimization](https://www.researchgate.net/profile/Hardik-Tankaria/publication/380000293_Regularized_Nystrom_method_for_Large-Scale_Unconstrained_Non-Convex_Optimization/links/6626b65443f8df018d21b6eb/Regularized-Nystroem-method-for-Large-Scale-Unconstrained-Non-Convex-Optimization.pdf) (preprint)_

Instead of the full Hessian, sample $$m \ll d$$ of its columns and use the
**Nyström method** to build a low-rank approximation of the whole matrix from that partial
information. The per-iteration cost drops from $$O(nd^2 + d^3)$$ to
$$O(ndm + dm^2)$$, and in our experiments $$m$$ of roughly **5-20% of $$d$$** was enough.

Two things make this work in practice rather than only on paper:

- **The indefiniteness problem.** On a non-convex objective the true Hessian has negative
  eigenvalues, so a low-rank approximation of it need not give a descent direction at all. Adding a
  regularizer to the sketch yields a positive-definite matrix and therefore a usable direction
  which is what makes the method applicable to neural networks rather than only to convex losses.
- **You never form the matrix.** The update $$\delta w$$ is computed directly, so neither the full
  Hessian nor its inverse is ever stored.

We established global convergence and analysed the global complexity, and benchmarked against
randomized subspace Newton and Newton-sketch on high-dimensional classification.

**The condition that matters:** this is a win when $$d$$ is large and the problem is
ill-conditioned. When $$d$$ is small, or gradients are very noisy, a well-tuned first-order method
is the better engineering choice. The sketch size $$m$$ is the dial, and the right setting is
problem-dependent.

### 3 · Variance reduction with Barzilai-Borwein steps

_[Journal of Industrial and Management Optimization 20(2), 525-547 (2024)](https://doi.org/10.3934/jimo.2023089)_
· with Nobuo Yamashita

SVRG removes most of the variance from stochastic gradients, but still needs a step size. The
Barzilai-Borwein rule derives one from two successive gradients, essentially free second-order
information, since the gradients are already computed.

We incorporated BB curvature into SVRG, and proved a linear convergence theorem that covers not
only our method but **other existing SVRG variants that use second-order information**: the more
useful contribution, since it closed a gap in the surrounding literature rather than only in our
own method. Evaluated on logistic regression and L2-SVM over gisette, covtype, ijcnn1 and MNIST.

## Current research: optimization for autonomous science

The thesis asked how much curvature information is worth paying for. My current work asks the same
question with a different scarce resource. In a laboratory the expensive quantity is not a matrix
factorisation; it is an experiment. Three lines follow from that, and I own each of them end to end.

### Sequential decision-making under a hard budget

Bayesian optimization decides what to measure next. The literature almost universally counts
**iterations**; a laboratory is limited by **instrument hours and reagents**, and different
experiments cost different amounts. Two consequences follow that iteration-counting hides: a policy
that wins per iteration can lose per unit spent, and a campaign can fail to finish at all because it
proposes something it cannot afford.

I build closed-loop systems where affordability is structural rather than checked afterwards. A cost
model fitted to real instrument runs prices every candidate; because it is a fitted closed form, the
feasible set is known exactly in advance, so the budget constraint is imposed _inside_ the
acquisition optimization. The same framing extends naturally to **constrained and multi-objective**
acquisition, where several competing properties must improve together under a shared budget, and to
**multi-fidelity** settings where a cheap observation and an expensive characterisation measure the
same thing at different resolutions.

### Heuristic search over combinatorial discovery spaces

Planning a chemical synthesis is a search over an AND/OR graph whose size grows exponentially with
depth. The dominant cost is **exploration**: how many candidates are examined before a complete
solution is found. The leverage is in the ordering heuristic, exactly as it is for A\* on a road
network, where the quality of the cost-to-go estimate decides whether the search finishes.

My work here reuses a planner's own learned cost-to-go estimate as the ordering signal, improving
solve rate at unchanged per-step compute, so any gain is navigation rather than a wider search. The
structure is general: whenever a learned model proposes ranked candidates and a search consumes
them, the ranking that decides what survives is usually answering a different question from the one
the search cares about. That observation is not specific to chemistry.

### Knowledge representation as a verified interface

Scientific machine learning systems are assembled from parts owned by different people, and the
expensive failure is **drift**: the component that produces a decision and the experiment that
validated it slowly stop being the same thing, while both continue to run.

I work on structured knowledge representations, descriptor ontologies and the versioned contracts
they publish, designed so that the handover is _required by test_ to reproduce the validated result
rather than merely resembling it. That means determinism enforced as a test, module boundaries
checked at process level, and continuous integration that gates its own published numbers. It also
means representing absence of knowledge explicitly, with confidence tiers and an explicit no-answer
state, so a caller can distinguish "examined and found nothing" from "never asked".

[Project write-ups →](/projects/)

## Earlier applied work

**Federated learning.** Second-order information is expensive to move, not only to compute. With
collaborators at IIT Mandi I worked on communication- and memory-efficient Nyström-approximated
curvature for the federated setting, as a Nyström-based ADMM method. On a ResNet-18 the Hessian does
not fit on a client at all; a sampled sketch takes the per-round cost from tens of hours to about
two minutes. Published as _Nys-Fed_ at IEEE IJCNN 2026.
[Read more →](/projects/7_nys_fed/)

**Medical imaging.** Brain-MRI tumour classification with transfer learning, using curvature-aware
optimization in a data-scarce regime, which is where getting more from each gradient actually
matters. Presented at the OIST International Symposium on AI and Brain Science.

## How I work

I would rather be trusted than impressive, so a note on method.

- **Design the experiment before running it.** A comparison decided after seeing the data is not a
  comparison.
- **Paired tests, not single-run deltas.** McNemar for paired binary outcomes, bootstrap confidence
  intervals for continuous ones.
- **State the detection floor.** "At $$n$$ seeds we cannot resolve a difference smaller than
  $$\Delta$$" belongs beside every result. Without it, a small improvement is indistinguishable from
  noise, and the reader has no way to know which they are looking at.
- **Report what did not work, with the mechanism.** Most levers do not pay. A method paper that
  reports only its own winner is less useful than one that says which five things failed and why.
- **Make the result re-derivable.** One command, from committed data, reading no analysis file.

## Selected talks

**ICCOPT 2019** (Berlin) · **ICIAM 2023** (Waseda, Tokyo) · **IBISML 2022** ·
**OIST AI & Brain Science Symposium 2022** (Okinawa) · **JSIAM 2024** (Niigata) ·
**Invited talk, IIT Mandi 2025**. Full list on the [Talks](/talks/) page.
