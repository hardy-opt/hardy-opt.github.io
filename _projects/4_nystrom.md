---
layout: page
title: Regularized Nyström curvature for large-scale optimization
description: Newton's method costs O(nd² + d³) per step. Sampling a few columns of the Hessian and reconstructing it with the Nyström method brings that to O(ndm + dm²), and a regularizer keeps the step usable when the Hessian is indefinite.
img: assets/img/figures3/ngds.png
importance: 4
category: research
related_publications: true
toc:
  sidebar: left
---

# NysReg-Gradient: regularized Nyström curvature

**The short version.** Second-order optimization methods converge quickly because they use
curvature, and almost nobody uses them at scale because curvature is expensive. This work samples a
small number of Hessian columns, reconstructs an approximation of the whole matrix from them, and
adds a regularizer that keeps the resulting step usable even on non-convex problems. The cost per
iteration falls from $$O(nd^2 + d^3)$$ to $$O(ndm + dm^2)$$, with $$m$$ around 5 to 20 percent of
the feature dimension.

**My contribution.** This is my own line of work, developed during my PhD at Kyoto University and
continued since. I designed the method, proved the convergence results, implemented it, and ran the
experiments. Co-authors on the papers are listed on the [Publications](/publications/) page.

### Problem statement and motivation

Large-scale optimization sits between two unsatisfying options.

**First-order methods** such as gradient descent are cheap. One pass over the data gives the
gradient, at $$O(nd)$$ for $$n$$ samples and $$d$$ parameters. They converge slowly, and the rate
degrades with the condition number of the problem: on a long narrow valley, gradient descent
zig-zags across it instead of travelling along it.

**Newton's method** uses the Hessian, the matrix of second derivatives, which tells you how the
slope is changing and therefore how far to step in each direction. Near a solution it converges
quadratically, and the condition number stops mattering because you are rescaling by the geometry
itself. The price is $$O(nd^2)$$ to form the Hessian and $$O(d^3)$$ to invert it.

That $$d^3$$ is the obstacle. At $$d = 10^3$$ it is a billion operations. At $$d = 10^4$$ it is
$$10^{12}$$, and ten thousand parameters is a small model.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures3/ngds.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
Performance of the NGD variants on the adult and ijcnn1 datasets: training cost and test error
against CPU time, which is the axis that matters when the question is whether curvature is
affordable.
</div>

### Core methodology

#### The Nyström approximation

Rather than compute the Hessian and then compress it, **sample it**. Choose $$m \ll d$$ column
indices at random. Computing only those columns gives a thin matrix
$$C \in \mathbb{R}^{d \times m}$$, and the corresponding rows and columns give a small intersection
matrix $$M \in \mathbb{R}^{m \times m}$$.

The Nyström method reconstructs an approximation of the full matrix from that slice:

$$
N_k \;=\; C \, M_k^{+} \, C^{\top}
$$

where $$M_k^{+}$$ is the pseudo-inverse of the best rank-$$k$$ approximation of $$M$$, obtained from
its singular value decomposition, with $$k \le m$$. The full $$d \times d$$ Hessian is never formed
at any point.

The construction is classical: it comes from numerical integration and is the same machinery behind
low-rank kernel approximation. What is new here is applying it to the Hessian inside an optimizer,
and making that survive contact with a non-convex objective.

#### The regularized update

The update takes the form

$$
w_{t+1} \;=\; w_t \;-\; \eta_t \, \big(N_t + \rho_t I\big)^{-1} \nabla f(w_t)
$$

and the regularization parameter is **adaptive**, scaled by the current gradient norm:

$$
\rho_t \;=\; c_1 \, \|\nabla f(w_t)\|^{\gamma}, \qquad c_1 > 0
$$

Three variants were studied, differing only in the exponent:

| Variant | $$\gamma$$ | Behaviour |
|---|---|---|
| NGD  | $$1/2$$ | mildest regularization, closest to pure Nyström-Newton |
| NGD1 | $$1$$   | regularization decays in proportion to the gradient |
| NGD2 | $$2$$   | strongest early damping, most conservative |

**Why the regularizer is the contribution, not the sketch.** On a non-convex objective the true
Hessian is **indefinite**: it has negative eigenvalues, because the iterate is near a saddle rather
than a bowl. A direction built from an indefinite matrix is not guaranteed to point downhill at
all, and a low-rank approximation inherits the problem.

Adding $$\rho_t I$$ makes $$(N_t + \rho_t I)$$ positive definite, so the step is a descent direction
by construction. Tying $$\rho_t$$ to the gradient norm means the damping is strong when far from a
solution and relaxes as the gradient shrinks, recovering fast local behaviour. That single change
is what makes the method applicable beyond convex losses.

#### Avoiding the inverse

Inverting a $$d \times d$$ matrix would undo the saving. The **Sherman-Morrison-Woodbury** identity
avoids it: because $$N_t$$ has rank at most $$k$$, write $$N_t = Z_t Z_t^{\top}$$ and then

$$
\big(N_t + \rho_t I\big)^{-1}
\;=\;
\frac{1}{\rho_t} I \;-\; \frac{1}{\rho_t^{2}} \, Z_t \Big(I_k + \tfrac{1}{\rho_t} Z_t^{\top} Z_t\Big)^{-1} Z_t^{\top}
$$

Everything on the right is either a scalar multiple of the identity or an operation on a
$$k \times k$$ matrix. The per-iteration cost becomes $$O(dm)$$ with $$m \ll d$$, which is what
makes the method practical.

#### Stochastic variant

For large datasets, **NSGD** uses mini-batch stochastic gradients every iteration while refreshing
the Nyström approximation far less often, typically once per epoch. The regularization parameter
for an epoch is computed from the stochastic gradient norm of the previous one. Curvature changes
more slowly than the gradient estimate, so refreshing it at the gradient's frequency would be
wasted work.

### Experimental results

#### How large does the sketch need to be?

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures3/diff_m.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
Effect of sketch size $$m$$ on NGD1 across datasets: training cost, iterations, test error and
gradient norm. The sketch size is the one real hyperparameter of the method, and this is the study
that tells you how to set it.
</div>

Small sketches suffice. On a dense dataset such as **gisette**, a sketch of **5 percent** of the
dimension is competitive. Sparse datasets such as **w8a** need more, around **15 to 20 percent**,
because the Hessian information is spread more thinly across coordinates and fewer sampled columns
capture it.

This is the practical takeaway: $$m$$ is problem-dependent and the dense/sparse distinction is a
usable rule of thumb, but the method does not choose $$m$$ for you.

### Theoretical contributions

Global convergence is established under standard assumptions, with an analysis of the global
complexity, and the method is shown to achieve superlinear convergence under appropriate
conditions. The analysis bounds the difference between the NGD direction and the true Newton
direction, which is what connects the approximation quality to the convergence rate.

There is also a clarifying result about how this relates to **Newton Sketch**. The Nyström
approximation can be written as

$$
X^{\top} U_k U_k^{\top} X + \rho I
$$

where $$U_k$$ is an orthogonal matrix derived from the structure of the data itself. Newton Sketch
uses a **random embedding** matrix in the same position. The comparison suggests why Nyström can be
more accurate at small sketch sizes: it is sampling along directions the data actually occupies,
rather than projecting onto random ones.

### Application: brain tumour classification from MRI

The method was applied to fine-tuning a pre-trained network for brain tumour detection, a setting
chosen because it is **data-scarce**, which is exactly where getting more out of each gradient
matters.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures3/mri_grid_image_svm.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
Sample images from the brain tumour MRI dataset, showing tumour and normal tissue.
</div>

**Dataset.** 253 images, reduced to 1000 dimensions; 177 training and 76 test examples, with 46
positive and 30 negative cases in the test split.

#### Confusion matrices

| Method | TP | TN | FP | FN |
|---|---|---|---|---|
| Newton | 40 | 25 | 5 | 6 |
| GD     | 30 | 27 | 3 | 16 |
| L-BFGS | 39 | 26 | 4 | 7 |
| **NGD**  | 39 | **28** | **2** | 7 |
| NGD1   | 39 | 26 | 4 | 7 |
| NGD2   | 39 | 26 | 4 | 7 |
| NSGD   | 36 | 26 | 4 | 10 |

#### Metrics

| Method | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| Newton | 0.855 | 0.889 | 0.870 | 0.879 |
| GD     | 0.750 | 0.909 | 0.652 | 0.759 |
| L-BFGS | 0.855 | 0.907 | 0.848 | 0.876 |
| **NGD**  | **0.882** | **0.951** | 0.848 | **0.897** |
| NGD1   | 0.855 | 0.907 | 0.848 | 0.876 |
| NGD2   | 0.855 | 0.907 | 0.848 | 0.876 |
| NSGD   | 0.816 | 0.900 | 0.783 | 0.837 |

NGD gives the best accuracy and F1 here, driven mainly by fewer false positives. Note the sample
size: the test set is 76 images, so a difference of one or two classifications moves these numbers
visibly. These are indicative, not a clinical claim, and I would want many more seeds and a larger
cohort before treating the ordering as settled.

### Limitations

- **Small $$d$$: use Newton.** The sketch avoids a cost you are not paying.
- **Very noisy gradients or tiny batches.** Curvature estimated from noise is worse than no
  curvature, and a well-tuned first-order method wins.
- **Well-conditioned problems.** Gradient descent is already close to optimal and the extra
  machinery earns nothing.
- **$$m$$ must be chosen,** and the method is sensitive to it. The study above informs the choice;
  it does not remove it.
- **Transformer-scale models are untested.** The experiments are convex problems and small
  networks. I would not claim the result extends to large-scale pretraining without running it.
- **The MRI result rests on 76 test images.** Treat it as a demonstration that the optimizer is
  usable in a data-scarce fine-tuning setting, not as a medical imaging result.

### Significance

The useful part of this work is not that a sketch is cheaper, which is arithmetic. It is that a
regularized sketch gives a **usable descent direction on a non-convex objective**, which is the
property that decides whether a second-order method can be used on anything other than a convex
loss. The connection to Newton Sketch also clarifies why data-derived sampling directions can beat
random ones at small sketch sizes.

The same construction carries into the federated setting, where the binding constraint is a client
device's memory rather than a datacentre's compute. That is
[Nys-Fed](/blog/2026/nys-fed-second-order-federated-learning/).

### Code and papers

- *NysReg-Gradient: Regularized Nyström-Gradient for Large-Scale Unconstrained Optimization and its
  Application.* IEEE IJCNN 2026 (WCCI).
- *Regularized Nyström Method for Large-Scale Unconstrained Non-Convex Optimization.* Preprint.
- *Nys-Newton: Nyström-Approximated Curvature for Convex Optimization.* IBISML, 2022.
- MATLAB experiment code: [`hardy-opt/Nys_Reg`](https://github.com/hardy-opt/Nys_Reg)
- A PyTorch implementation is in preparation, which will make the method usable as a drop-in
  `torch.optim` optimizer.

### References

- **On the Nyström Method for Approximating a Gram Matrix for Improved Kernel-Based Learning.**
  Petros Drineas, Michael Mahoney. JMLR 6:2153-2175, 2005.
  *The foundational treatment of the Nyström approximation used here on the Hessian.*
- **RSN: Randomized Subspace Newton.**
  Robert Gower, Dmitry Kovalev, Felix Lieder, Peter Richtárik. NeurIPS 2019.
  *A principal competitor, and one of the baselines in the experiments.*
- **Newton Sketch: A Near Linear-Time Optimization Algorithm with Linear-Quadratic Convergence.**
  Mert Pilanci, Martin Wainwright. SIAM J. Optimization 27(1):205-245, 2017.
  *The other principal competitor, and the method the structural comparison above is drawn against.*
- **Convergence Properties of the Regularized Newton Method for Unconstrained Nonconvex Optimization.**
  Kenji Ueda, Nobuo Yamashita. Applied Mathematics and Optimization 62:27-46, 2010.
  *The direct inspiration for the adaptive regularization strategy.*
