---
layout: post
title: "Nys-Fed: making second-order federated learning fit on an edge device"
date: 2026-07-05 09:00:00+0900
description: Newton-type methods converge in far fewer communication rounds than FedAvg, and nobody uses them, because a Hessian for a 25M-parameter model does not fit on a client. Here is what a Nyström sketch changes, with numbers.
tags: optimization federated-learning second-order
categories: optimization
giscus_comments: false
related_posts: true
toc:
  sidebar: left
---

This post walks through **Nys-Fed**, a paper I co-authored with Sagnik Ghosh, Arnav Bhavsar, Varun
Dutt and Dinesh Singh at IIT Mandi, published at **IEEE IJCNN 2026 (WCCI)**. It is the federated
chapter of the Nyström curvature line I have been working on since my PhD, and it is the clearest
example I have of a theoretical idea that turns into a practical capability.

The short version: second-order federated optimization converges in far fewer communication rounds
than first-order methods, and almost nobody uses it because the Hessian does not fit on a phone.
Replacing the Hessian with a sampled low-rank sketch takes the per-round cost for a ResNet-18 from
**tens of hours to about two minutes**.

## 1. Why federated learning is really a communication problem

In federated learning the data never leaves the client. Each device computes something from its own
data (gradients, or model updates) and sends only that to a parameter server, which aggregates and
sends a global model back. Nothing privacy-revealing crosses the network.

The cost that dominates is **communication rounds**. Every round means every participating device
uploading, the server aggregating, and the result coming back down, across links that are slow,
metered and unreliable, to devices that may not even be awake. So the question that matters is not
"how many gradient steps?" but **"how few rounds can we finish in?"**

`FedAvg` and `FedProx` are first-order methods. They work, they are cheap per round, and they take a
lot of rounds, and they degrade badly when client data is **non-IID**, which in practice it always
is. Your phone's photos do not look like mine.

## 2. The second-order case, and why it is usually ignored

Newton-type methods use curvature, not just slope. They point more directly at the minimum, so they
need dramatically fewer rounds. On non-IID data the advantage is larger still, because curvature
carries information about the local geometry that an averaged gradient throws away.

{% include figure.liquid loading="eager" path="assets/img/nysfed/newton-vs-sgd.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">Newton-type descent against SGD-based paths of the kind used in FedAvg, FedProx and FOMO. Fewer, better-directed steps, if you can afford the curvature. <em>Figure from the Nys-Fed paper.</em></div>

The reason nobody does it is arithmetic. For a model with $$d$$ parameters the Hessian is
$$d \times d$$. For ResNet-18, $$d \approx 11.7$$ million, so the Hessian has about
$$1.4 \times 10^{14}$$ entries. In 32-bit floats that is over half a petabyte. You cannot form it,
you cannot store it, you certainly cannot invert it, and you absolutely cannot send it anywhere.

Existing second-order federated methods work around this in sensible but limited ways. **FedNew**
computes the Hessian once and reuses it, refreshing periodically, but a refresh costs as much as
plain Newton. **FedNS** and **FLeNS** use Newton sketching with a random transform, which reduces
what gets communicated but still needs the Hessian to produce the sketch. **DONE** approximates the
local Hessian using Richardson iterations after several local steps.

All of them improve the descent direction. None of them makes the memory problem go away on a device
with a few hundred megabytes of GPU.

## 3. The idea: never build the Hessian

Here is the move. Do not approximate the Hessian after computing it. **Sample it.**

Pick $$m \ll d$$ column indices uniformly at random. Compute only those $$m$$ columns, giving a thin
matrix $$\mathbf{C} \in \mathbb{R}^{d \times m}$$, and let $$\mathbf{M} \in \mathbb{R}^{m\times m}$$
be the intersection block. The **Nyström method** reconstructs an approximation of the full matrix
from that slice:

$$\mathbf{N} = \mathbf{C}\,\mathbf{M}^{-1}\,\mathbf{C}^{\top}$$

Take the SVD of $$\mathbf{M}$$ to get the best rank-$$k$$ version. The full $$d \times d$$ matrix is
never formed at any point.

{% include figure.liquid loading="eager" path="assets/img/nysfed/nystrom-client-breakdown.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">Nyström approximation of the Hessian at the client. Only sampled columns and the small intersection block are ever computed. <em>Figure from the Nys-Fed paper.</em></div>

### The detail that makes it work

Written naively this breaks on neural networks. A deep model's loss is non-convex, so its Hessian is
**indefinite** (it has negative eigenvalues) and a direction built from an indefinite matrix is
not guaranteed to point downhill at all. A low-rank approximation inherits the problem.

The fix is the $$\ell_2$$ regularizer that is already in the objective. For

$$\min_{\mathbf{w}} \Big\{ f(\mathbf{w}) = \sum_{i=1}^{n} f_i(\mathbf{w}) + \tfrac{\lambda}{2}\|\mathbf{w}\|^2 \Big\}$$

the Hessian is $$\mathbf{H} = \sum_i \nabla^2 f_i(\mathbf{w}) + \lambda\mathbf{I}$$, and because the
$$\lambda$$ carries into the sampled blocks, $$\mathbf{M}$$ becomes positive definite. The sketch is
a **fixed-rank** Nyström approximation, the direction is a descent direction, and the smallest
eigenvalue of $$\mathbf{M}^{-1}$$ is controlled: which is what the convergence argument needs.

In the paper we go further: $$\rho_k$$ is set to $$-\lambda_{\min}(\mathbf{W}_k)$$ when that quantity
is negative and to $$\|\mathbf{g}_k\|$$ otherwise, which keeps the approximated matrix positive
definite across every deep model we tested rather than only in the convex case.

### Inverting it without inverting it

The remaining cost is the inverse. Here the **Sherman-Morrison-Woodbury** identity does the work: an
inverse of a $$d \times d$$ matrix with a rank-$$m$$ structure becomes an inverse of an
$$m \times m$$ matrix plus some matrix-vector products. With $$m$$ in the tens and $$d$$ in the
millions, that is the difference between impossible and routine.

### Keeping the curvature private

Sending a curvature estimate is not obviously privacy-preserving. Following FedNew, Nys-Fed runs a
**one-pass ADMM** step over the sketched Hessian, so what leaves the client is an ADMM-passed update
rather than curvature itself:

$$\mathbf{y}_i^k = \big(\mathbf{N}^k_i + \alpha_k\mathbf{I} + \rho\mathbf{I}\big)^{-1}\big(\mathbf{g}_i^k - \lambda_i^{k-1} + \rho\,\mathbf{y}^{k-1}\big)$$

The server averages the $$\mathbf{y}_i^k$$ across clients, updates the global weights, and each
client updates its dual variable. One pass (not an inner ADMM loop) which is what keeps the client
cost near first-order.

{% include figure.liquid loading="eager" path="assets/img/nysfed/edge-fl.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">The federated setting: curvature is sketched on-device, passed through one ADMM step, and aggregated at the parameter server. <em>Figure from the Nys-Fed paper.</em></div>

Per global update this gives $$O(\log\frac{1}{\epsilon})$$ communication and
$$O(d\log\frac{1}{\epsilon})$$ convergence time.

## 4. What the numbers say

### Deep models: the headline

Communication time per round, under the same recommended model and hyperparameter settings:

| Model | DONE | FedNew | FedNS | **Nys-Fed** |
|---|---|---|---|---|
| ResNet-18 (11.4M params) | ≥ 48 h | ≥ 132 h | ≥ 48 h | **130-141 s** |
| ResNet-50 (23.9M params) | ≥ 56 h | ≥ 156 h | ≥ 100 h | **700-820 s** |
| Custom DNN (0.1M params) | ≥ 20 h | ≥ 72 h | ≥ 100 h | **105-250 s** |

That is not a tuning win. It is a change in what is possible on the hardware, hours to minutes.

**One asymmetry worth stating plainly, because it cuts against the obvious reading.** For FedNew and
FedNS on the deep models, parameters were frozen up to the last layer and the inverse Hessian
computed only for that layer. Nys-Fed computed its sketch over *all* learnable parameters. So the
baselines were given the easier job and still took hours. Without that note the table is not
interpretable, which is exactly why it belongs here.

### Convex models, like-for-like against DONE

On the `phishing` dataset, where both methods can run properly:

| | DONE, 2 local iters | **Nys-Fed, 8 cols** | DONE, 5 iters | **Nys-Fed, 16 cols** | DONE, 10 iters | **Nys-Fed, 64 cols** |
|---|---|---|---|---|---|---|
| Time per epoch (s) | 151 | **7.6** | 513.5 | **16** | 745.1 | **45.3** |
| Time for 1000 epochs (h) | 41.6 | **2.11** | 142.6 | **4.4** | 206.9 | **12.58** |

{% include figure.liquid loading="eager" path="assets/img/nysfed/phishing-logistic.png" class="img-fluid rounded z-depth-1" %}
<div class="caption">phishing, logistic loss, semilog. Nys-Fed against first-order (FedAvg, FedAdam, FedProx) and second-order (FedNew, FedNS, DONE) baselines. <em>Figure from the Nys-Fed paper.</em></div>

### Across datasets and architectures

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/nysfed/femnist-resnet18.png" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/nysfed/cinic10.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">Left: femnist on ResNet-18. Right: cinic10 on a custom residual model, federated via a Dirichlet split with α = 0.5. <em>Figures from the Nys-Fed paper.</em></div>

Evaluated on **femnist** and **shakespeare** from LEAF (the latter non-IID across 1,129 clients with
a 1.1M-parameter LSTM for next-character prediction), **cinic10** split by Dirichlet(0.5), and
**phishing / w8a / realsim** from libsvm with logistic and L2-SVM objectives. Baselines span both
families: FedAvg, FedProx, FedAdam on one side; FedNew, FedNS, DONE on the other.

## 5. What this does not show

The limits, because a results table without them is marketing.

- **Communication time, not wall-clock training time.** The tables measure the per-round
  communication cost. They are not end-to-end training comparisons.
- **DONE ran with one Richardson iteration.** DONE's own paper reports better convergence with more
  local iterations; the comparison is at the setting that matches Nys-Fed's single-local-update
  framework, which is the fair framework comparison but not DONE at its best.
- **$$m$$ is a hyperparameter.** The convex tables vary it from 8 to 64 columns deliberately, and
  the cost scales with it. There is no automatic choice.
- **The gains depend on $$d$$ being large.** That is the whole premise: the sketch avoids a cost you
  only pay at scale. At small $$d$$ there is nothing to save.
- **Single-objective, classification and language modelling.** No claim about other task families.

## 6. Why I like this result

Most of my PhD was convergence proofs and CUTEst benchmarks. It is satisfying work and the feedback
loop is long and abstract.

This is the same mathematics: a sampled low-rank approximation of a matrix you cannot afford to
build, regularized so the direction stays usable, pointed at a constraint that is completely
concrete: *this device has 400 MB of GPU memory and a metered connection.* The mathematics does not
change. What changes is that the answer is now the difference between a method that runs and a
method that does not.

That is the line of work I want to keep doing: the part of optimization theory that turns into
something that fits on the hardware you actually have.

## Code and citation

Implementation from the paper, by my co-author Sagnik Ghosh:
**[github.com/sagnik04g/Nys-Fed](https://github.com/sagnik04g/Nys-Fed)**

> **Nys-Fed: Communication and Memory Efficient Nyström Approximated Curvature for Federated
> Learning.** Sagnik Ghosh, Hardik Tankaria, Arnav Bhavsar, Varun Dutt, Dinesh Singh.
> *IEEE International Joint Conference on Neural Networks (IJCNN), IEEE World Congress on
> Computational Intelligence (WCCI)*, Maastricht, 2026.

Related work of mine on the same curvature line: *NysReg-Gradient* (IJCNN 2026) and
[*Regularized Nyström for non-convex optimization*](/publications/). Background on the sketch itself:
[what a Hessian sketch actually buys you](/blog/2025/what-a-hessian-sketch-buys-you/).

<!-- ⚠️ BEFORE PUBLISHING: add the DOI / IEEE Xplore link to the citation block above.
     See ../../FACTS.md section 5. Also notify your co-authors as a courtesy: the figures
     are joint work. Provenance note at assets/img/nysfed/SOURCE.md -->
