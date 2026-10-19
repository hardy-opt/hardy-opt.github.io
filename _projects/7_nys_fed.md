---
layout: page
title: Second-order federated learning on edge devices
description: Newton-type methods converge in far fewer communication rounds than FedAvg, and nobody uses them because a Hessian for a 25M-parameter model does not fit on a client. A sampled low-rank sketch changes that.
img: assets/img/nysfed/nystrom-client-breakdown.png
importance: 6
category: research
related_publications: false # the page carries its own annotated References section
toc:
  sidebar: left
---

# Nys-Fed: making curvature affordable on a client device

**My contribution.** This is the federated chapter of the Nyström curvature line I developed during
my PhD. I contributed the regularized Nyström construction the method is built on, the convergence
argument, and the design of the federated algorithm. Published at **IEEE IJCNN 2026 (WCCI)** with
Sagnik Ghosh, Arnav Bhavsar, Varun Dutt and Dinesh Singh, from work with the group at IIT Mandi.
Implementation by Sagnik Ghosh. Figures on this page are from our paper, reproduced with my
co-authors' agreement.

### Contents

- [Why federated learning is a communication problem](#why-federated-learning-is-a-communication-problem)
- [The second-order case, and why it is normally ignored](#the-second-order-case-and-why-it-is-normally-ignored)
- [The method](#the-method)
- [Results](#results)
- [Limitations](#limitations)
- [References](#references)

### Why federated learning is a communication problem

In federated learning the data never leaves the client. Each device computes something from its own
data and sends only that to a parameter server, which aggregates and returns a global model.
Nothing privacy-revealing crosses the network.

The cost that dominates is **communication rounds**. Every round means each participating device
uploading, the server aggregating, and the result coming back down, across links that are slow,
metered and unreliable, to devices that may not be awake. So the question is not "how many gradient
steps?" but **how few rounds can we finish in?**

`FedAvg` and `FedProx` are first-order methods. They are cheap per round and take many rounds, and
they degrade when client data is **non-IID**, which in practice it always is.

### The second-order case, and why it is normally ignored

Newton-type methods use curvature rather than slope alone, so they point more directly at the
minimum and need far fewer rounds. On non-IID data the advantage is larger still, because curvature
carries local geometry that an averaged gradient discards.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/nysfed/newton-vs-sgd.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
Newton-type descent against the SGD-based paths used by FedAvg, FedProx and FOMO. Fewer,
better-directed steps, if you can afford the curvature.
</div>

The reason nobody does it is arithmetic. For $$d$$ parameters the Hessian is $$d \times d$$. For
ResNet-18, $$d \approx 11.7$$ million, so the Hessian holds about $$1.4 \times 10^{14}$$ entries:
over half a petabyte in 32-bit floats. You cannot form it, store it, invert it, or send it.

Existing second-order federated methods work around this in limited ways. **FedNew** computes the
Hessian once and refreshes periodically, but a refresh costs as much as plain Newton. **FedNS** and
**FLeNS** use Newton sketching with a random transform, which reduces what is communicated but
still needs the Hessian to produce the sketch. **DONE** approximates the local Hessian with
Richardson iterations. All improve the direction; none makes the memory problem disappear on a
device with a few hundred megabytes of GPU.

### The method

Do not approximate the Hessian after computing it. **Sample it.**

Pick $$m \ll d$$ column indices at random. Computing only those columns gives a thin matrix
$$\mathbf{C} \in \mathbb{R}^{d \times m}$$, with $$\mathbf{M} \in \mathbb{R}^{m \times m}$$ the
intersection block. The **Nyström method** reconstructs an approximation of the whole matrix from
that slice:

$$\mathbf{N} = \mathbf{C}\,\mathbf{M}^{-1}\,\mathbf{C}^{\top}$$

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/nysfed/nystrom-client-breakdown.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
Nyström approximation of the Hessian at the client. Only the sampled columns and the small
intersection block are ever computed.
</div>

**Keeping the direction usable.** A deep model's loss is non-convex, so its Hessian is indefinite
and a direction built from it need not point downhill. The $$\ell_2$$ regularizer already in the
objective carries into the sampled blocks, making $$\mathbf{M}$$ positive definite. The sketch is a
**fixed-rank** Nyström approximation, the step is a descent direction, and the smallest eigenvalue
is controlled, which is what the convergence argument needs.

**Inverting without inverting.** The **Sherman-Morrison-Woodbury** identity turns the inverse of a
$$d \times d$$ matrix with rank-$$m$$ structure into the inverse of an $$m \times m$$ matrix plus
matrix-vector products. With $$m$$ in the tens and $$d$$ in the millions, that is the difference
between impossible and routine.

**Keeping curvature private.** Sending a curvature estimate is not obviously privacy-preserving, so
a **one-pass ADMM** step runs over the sketched Hessian, and what leaves the client is an
ADMM-passed update:

$$\mathbf{y}_i^k = \big(\mathbf{N}^k_i + \alpha_k\mathbf{I} + \rho\mathbf{I}\big)^{-1}\big(\mathbf{g}_i^k - \lambda_i^{k-1} + \rho\,\mathbf{y}^{k-1}\big)$$

The server averages across clients, updates the global weights, and each client updates its dual
variable. One pass, not an inner loop, which keeps client cost near first-order. Per global update
this gives $$O(\log\frac{1}{\epsilon})$$ communication and $$O(d\log\frac{1}{\epsilon})$$
convergence time.

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/nysfed/edge-fl.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
Curvature is sketched on-device, passed through one ADMM step, and aggregated at the parameter server.
</div>

### Results

**Communication time per round**, under matched model and hyperparameter settings:

| Model                    | DONE   | FedNew  | FedNS   | **Nys-Fed**      |
| ------------------------ | ------ | ------- | ------- | ---------------- |
| ResNet-18 (11.4M params) | ≥ 48 h | ≥ 132 h | ≥ 48 h  | **130 to 141 s** |
| ResNet-50 (23.9M params) | ≥ 56 h | ≥ 156 h | ≥ 100 h | **700 to 820 s** |
| Custom DNN (0.1M params) | ≥ 20 h | ≥ 72 h  | ≥ 100 h | **105 to 250 s** |

That is a change in what the hardware can do, not a tuning win.

**One asymmetry worth stating,** because it cuts against the easy reading: for FedNew and FedNS on
the deep models, parameters were frozen up to the last layer and the inverse Hessian computed only
for that layer. Nys-Fed sketched over _all_ learnable parameters. The baselines were given the
easier job and still took hours.

**Convex models, like-for-like against DONE** on the `phishing` dataset:

|                          | DONE, 2 iters | **Nys-Fed, 8 cols** | DONE, 5 iters | **Nys-Fed, 16 cols** | DONE, 10 iters | **Nys-Fed, 64 cols** |
| ------------------------ | ------------- | ------------------- | ------------- | -------------------- | -------------- | -------------------- |
| Time per epoch (s)       | 151           | **7.6**             | 513.5         | **16**               | 745.1          | **45.3**             |
| Time for 1000 epochs (h) | 41.6          | **2.11**            | 142.6         | **4.4**              | 206.9          | **12.58**            |

<div class="row">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/nysfed/femnist-resnet18.png" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/nysfed/cinic10.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
Left: femnist on ResNet-18. Right: cinic10 on a custom residual model, federated via a Dirichlet
split at α = 0.5.
</div>

Evaluated on **femnist** and **shakespeare** from LEAF (the latter non-IID across 1,129 clients with
a 1.1M-parameter LSTM), **cinic10** under a Dirichlet split, and **phishing / w8a / realsim** from
libsvm with logistic and L2-SVM objectives. Baselines span both families: FedAvg, FedProx, FedAdam
on one side; FedNew, FedNS, DONE on the other.

### Limitations

- **Communication time per round, not end-to-end training time.** The tables measure the per-round
  cost and are not full training comparisons.
- **DONE ran with one Richardson iteration.** Its own paper reports better convergence with more;
  this is the setting that matches the single-local-update framework, which is the fair framework
  comparison but not DONE at its best.
- **The sketch size is a hyperparameter.** The convex tables vary it from 8 to 64 columns
  deliberately, and cost scales with it.
- **The gains depend on $$d$$ being large.** That is the premise: the sketch avoids a cost you only
  pay at scale.
- **Classification and language modelling only.** No claim about other task families.

### Code and paper

Implementation by my co-author Sagnik Ghosh:
**[github.com/sagnik04g/Nys-Fed](https://github.com/sagnik04g/Nys-Fed)**

> **Nys-Fed: Communication and Memory Efficient Nyström Approximated Curvature for Federated
> Learning.** Sagnik Ghosh, Hardik Tankaria, Arnav Bhavsar, Varun Dutt, Dinesh Singh.
> _IEEE International Joint Conference on Neural Networks (IJCNN), IEEE World Congress on
> Computational Intelligence (WCCI)_, Maastricht, 2026.

Extended discussion: [the blog post on this work](/blog/2026/nys-fed-second-order-federated-learning/).
The underlying curvature method: [regularized Nyström](/projects/4_nystrom/).

### References

- **FedNew: A Communication-Efficient and Privacy-Preserving Newton-Type Method for Federated
  Learning.** Anis Elgabli et al. ICML 2022. _The one-pass ADMM construction this builds on._
- **Communication-Efficient Learning of Deep Networks from Decentralized Data.**
  Brendan McMahan et al. AISTATS 2017. _FedAvg, the first-order baseline._
- **DONE: Distributed Approximate Newton-type Method for Federated Edge Learning.**
  Canh Dinh et al. IEEE TPDS, 2022. _The Richardson-iteration baseline._
