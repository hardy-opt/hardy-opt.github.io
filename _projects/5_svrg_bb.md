---
layout: page
title: Variance reduction with Barzilai-Borwein step sizes
description: SVRG removes most of the noise from stochastic gradients but still needs a step size. The Barzilai-Borwein rule derives one from gradients already computed, making it essentially free curvature information.
img: assets/img/figures2/Gisette-1.0e-05-Opt_Time.png
importance: 5
category: research
related_publications: true
toc:
  sidebar: left
---

# SVRG with Barzilai-Borwein curvature

**My contribution.** Method design, the convergence proof, implementation and experiments. With
Nobuo Yamashita; published in the _Journal of Industrial and Management Optimization_.

### The problem

Fitting a model to data means minimising an average loss over $$n$$ training examples:

$$
\min_{w \in \mathbb{R}^d} \; f(w) \;=\; \frac{1}{n} \sum_{i=1}^{n} f_i(w)
$$

Computing the full gradient $$\nabla f(w)$$ costs a pass over all $$n$$ examples. When $$n$$ is
large that is too slow, so **stochastic gradient descent** samples one example (or a small batch)
and steps on that instead:

$$
w_{t+1} \;=\; w_t - \eta_t \nabla f_{i_t}(w_t), \qquad i_t \sim \text{Uniform}\{1,\dots,n\}
$$

The estimate is unbiased, so on average it points the right way. The difficulty is **variance**:
each individual step can point almost anywhere, and the iterates fluctuate rather than descending.
To converge at all, the step size has to shrink toward zero, which is what makes SGD slow in its
final phase.

### Variance reduction

**SVRG** removes most of that noise with a control variate. Periodically it computes a full
gradient at a snapshot point $$\tilde{w}$$ and stores it. Between snapshots the update is

$$
v_t \;=\; \nabla f_{i_t}(w_t) \;-\; \nabla f_{i_t}(\tilde{w}) \;+\; \nabla f(\tilde{w})
$$

This is still unbiased, since the two correction terms have equal expectation. But its variance
shrinks as both $$w_t$$ and $$\tilde w$$ approach the solution, because the first two terms are then
evaluated at nearby points and largely cancel. With the noise controlled, a **constant** step size
becomes viable, and on strongly convex problems SVRG recovers linear convergence.

That leaves one question: what should the constant step size be? In practice it does most of the
work, and in practice it is tuned by hand.

### Barzilai-Borwein step sizes

The **Barzilai-Borwein** rule answers that from information already in hand. Write the differences
between successive iterates and gradients:

$$
s_t \;=\; w_t - w_{t-1}, \qquad y_t \;=\; \nabla f(w_t) - \nabla f(w_{t-1})
$$

A quasi-Newton method looks for a matrix $$B$$ satisfying the secant equation $$B s_t = y_t$$. The
Barzilai-Borwein idea is to insist that $$B$$ be a multiple of the identity, $$B = \alpha^{-1} I$$,
and solve the resulting least-squares problem. That gives two step sizes:

$$
\alpha_t^{\mathrm{BB1}} \;=\; \frac{s_t^{\top} s_t}{s_t^{\top} y_t},
\qquad
\alpha_t^{\mathrm{BB2}} \;=\; \frac{s_t^{\top} y_t}{y_t^{\top} y_t}
$$

Two things make this attractive. It is **curvature information**, since it is derived from the
secant equation, so it adapts to the local geometry rather than following a fixed schedule. And it
is **free**: $$s_t$$ and $$y_t$$ are built from quantities the algorithm already computed. No
Hessian, no extra pass over the data, two inner products.

### What we did

We incorporated Barzilai-Borwein curvature into SVRG, computing the step size at each snapshot from
the full gradients that SVRG already evaluates there, and separately studied using the BB step size
itself as a variant.

**The part I would point to is the theorem, not the algorithm.** We proved a linear convergence
result that covers not only this method but **other existing SVRG variants that use second-order
information**. Several such variants were already in use without a convergence guarantee of that
generality. Closing that gap in the surrounding literature is a more useful contribution than one
more algorithm, because it justifies methods other people were already running.

### Experiments

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures2/Gisette-1.0e-05-Opt_Time.png" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/figures2/Gisette-1.0e-05-Var_Epoch.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
Gisette at regularization $$10^{-5}$$. Left: optimality gap against CPU time. Right: the variance
of the gradient estimate per epoch, which is the quantity the method is designed to control.
</div>

Two problem families were used, both convex:

**L2-regularized logistic regression.**

$$
f(w) \;=\; \frac{1}{n}\sum_{i=1}^{n} \log\!\big(1 + \exp(-y_i\, x_i^{\top} w)\big) \;+\; \frac{\lambda}{2}\|w\|^2
$$

**L2-regularized squared-hinge SVM.**

$$
f(w) \;=\; \frac{1}{n}\sum_{i=1}^{n} \max\!\big(0,\, 1 - y_i\, x_i^{\top} w\big)^{2} \;+\; \frac{\lambda}{2}\|w\|^2
$$

Datasets: **gisette**, **covtype**, **ijcnn1** and **MNIST**, spanning dense and sparse regimes and
a range of dimensions.

The proposed method with a **constant** step size outperforms existing variance-reduced methods on
several of these problems. The right-hand figure above is the more informative one: it shows the
variance of the gradient estimate falling, which is the mechanism rather than the outcome.

### Limitations

- **Several, not all.** It does not win everywhere, and the paper reports which problems it does
  not. A method paper that reports only its own wins is less useful than one that marks the
  boundary.
- **Barzilai-Borwein step sizes can oscillate.** The rule is not monotone and can produce wildly
  varying step sizes on ill-conditioned problems. The stabilising safeguards are part of the method,
  not an implementation detail.
- **Convex objectives only.** The convergence theorem does not cover non-convex losses, and I do
  not claim it does.
- **Full gradients at snapshots.** SVRG's periodic full-gradient computation is a real cost, and it
  is what makes the method less attractive in the very large $$n$$ regime where even one pass is
  expensive.

### Code and paper

- _A Stochastic Variance Reduced Gradient using Barzilai-Borwein Techniques as Second Order
  Information._ Journal of Industrial and Management Optimization 20(2), 525-547, 2024.
  [doi:10.3934/jimo.2023089](https://doi.org/10.3934/jimo.2023089)
- MATLAB implementation and figures: [`hardy-opt/SVRG2BB`](https://github.com/hardy-opt/SVRG2BB)

### References

- **Accelerating Stochastic Gradient Descent using Predictive Variance Reduction.**
  Rie Johnson, Tong Zhang. NeurIPS 2013.
  _The original SVRG, and the control variate construction above._
- **Two-Point Step Size Gradient Methods.**
  Jonathan Barzilai, Jonathan Borwein. IMA Journal of Numerical Analysis 8(1):141-148, 1988.
  _The step size rule, and the secant derivation it comes from._
- **Barzilai-Borwein Step Size for Stochastic Gradient Descent.**
  Conghui Tan, Shiqian Ma, Yu-Hong Dai, Yuqiu Qian. NeurIPS 2016.
  _The closest prior work combining the two ideas, and one of the methods the convergence theorem
  also covers._
