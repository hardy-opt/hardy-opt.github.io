---
layout: page
permalink: /research/
title: Research
description: Making curvature information affordable at high dimension, and knowing when it is not worth it.
nav: true
nav_order: 2
toc:
  sidebar: left
---

**Research areas:** Mathematical Optimization · Optimization for Machine Learning ·
Second-Order & Stochastic Methods · Randomized Numerical Linear Algebra

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

## The thesis

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

## Applications

**Federated learning.** Second-order information is expensive to move, not just to compute. With
collaborators at IIT Mandi I worked on communication- and memory-efficient Nyström-approximated
curvature for the federated setting, as a Nyström-based ADMM method (_Nys-Fed_, IEEE IJCNN 2026).

**Medical imaging.** Brain-MRI tumour classification with transfer learning, using curvature-aware
optimization in a data-scarce regime: the setting where better use of each gradient actually
matters, because there are not many of them. Presented at the OIST International Symposium on AI &
Brain Science.

**AI for science.** At MI-6 the same question reappears in a different guise: when each evaluation
is an experiment that costs instrument time, the expensive resource is no longer FLOPs but the
experiment itself. See [Projects](/projects/).

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
