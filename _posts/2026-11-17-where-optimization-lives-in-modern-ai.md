---
layout: post
title: Where optimization actually lives in modern AI
date: 2026-11-17 09:00:00+0900
description: A map of the optimization problems inside modern machine learning and generative AI: what is being minimised, which method solves it, why that method and not another, and which parts are still badly solved.
tags: optimization MLDL
categories: optimization
giscus_comments: false
related_posts: true
toc:
  sidebar: left
---

"Machine learning is just optimization" is true in the way that "chemistry is just physics" is true:
accurate, and not useful on its own. The useful version is more specific, modern AI contains
**many distinct optimization problems**, with different structure, different constraints, and
different right answers. Training is one of them. It is not the hardest one, and it is no longer the
most expensive one.

This is a map of them. For each: what is being minimised, what actually solves it, why that method
and not another, and where the open problems are. I have tried to be honest about which parts are
well understood and which are still folklore.

## 1. The one everyone means: empirical risk minimisation

Fit parameters $$\mathbf{w}$$ to data by minimising average loss:

$$\min_{\mathbf{w}} \; \frac{1}{n}\sum_{i=1}^{n} \ell\!\left(f(\mathbf{x}_i;\mathbf{w}),\, y_i\right) + \lambda R(\mathbf{w})$$

That is it. Logistic regression, a ResNet and a 70-billion-parameter language model are all this
problem; they differ in whether $$f$$ is linear, how big $$n$$ and $$d$$ are, and whether the
objective is convex.

**Convex case** ($$f$$ linear, $$\ell$$ convex): solved, in the strong sense that we have methods
with proofs, rates matching lower bounds, and reliable software. Any local minimum is global.

**Non-convex case** (anything deep): not solved, and the interesting discovery of the last decade is
that it mostly does not matter. In high dimension, local minima are rarely the obstacle, saddle
points and ill-conditioning are. Most minima found by SGD generalise comparably. The practical
question shifted from *"will we find a good minimum?"* to *"how cheaply, and which one?"*

### What is used, and why

**SGD with momentum.** Use a mini-batch estimate of the gradient. Momentum accumulates an
exponentially weighted average of past gradients, which damps oscillation across a narrow valley and
accelerates along it. Still the best choice for convolutional vision models, and still competitive
when well tuned.

**Adam and AdamW.** Per-parameter adaptive step sizes from running estimates of the gradient's first
and second moments. This is a **diagonal preconditioner**: it rescales each coordinate by its own
recent gradient magnitude. It is a crude curvature approximation, and the crudeness is the point
$$O(d)$$ memory and arithmetic, no matrices.

AdamW's decoupling of weight decay from the adaptive update is a small change that matters
disproportionately, because with Adam the $$\ell_2$$ penalty gets divided by the same adaptive
denominator as the gradient and stops acting like weight decay at all.

**Why Adam dominates transformers** is still partly empirical. The most credible explanation is that
transformer loss landscapes are badly conditioned *across coordinate blocks*. Embeddings, attention
projections and layer-norm parameters have gradient scales orders of magnitude apart, and diagonal
rescaling handles exactly that. SGD has to pick one learning rate for all of them.

**Learning-rate schedules are part of the optimizer, not a detail.** Warmup, cosine decay, and the
various cyclical schemes change which minimum you land in, not just how fast you get there. Warmup
in particular exists because adaptive methods have unreliable second-moment estimates in the first
few hundred steps, and a large step taken on a bad estimate is hard to recover from.

### Second-order methods: the standing puzzle

Newton's method converges quadratically near a solution. For $$d$$ parameters, forming and inverting
the Hessian is $$O(nd^2 + d^3)$$. At $$d = 10^9$$ this is not a large constant factor, it is
physically impossible.

So the field approximates:

- **L-BFGS** builds an implicit inverse-Hessian estimate from a short history of gradient
  differences. Excellent for deterministic, medium-scale problems; it struggles with stochastic
  gradients, because the curvature estimate is built from differences that are now mostly noise.
- **K-FAC** approximates the Fisher information as a Kronecker product of two small factors per
  layer. Tractable, and genuinely used.
- **Shampoo** maintains full-matrix preconditioners per tensor dimension, and in distributed form is
  now used in production training.
- **Sophia, Muon** and the recent wave use cheap diagonal or orthogonalised curvature estimates with
  clipping, aiming for second-order benefit at near-first-order cost.
- **Sketching and low-rank methods** compute curvature on a random subspace. Sample $$m \ll d$$
  Hessian columns and reconstruct via the Nyström method: cost drops to
  $$O(ndm + dm^2)$$. This is where [my own work](/research/) sits, including the
  [federated version](/blog/2026/nys-fed-second-order-federated-learning/) where the binding
  constraint is a client device's memory rather than a datacentre's.

**My honest read:** second-order methods are undervalued in the well-conditioned, abundant-data
regime and genuinely valuable when data is scarce, the problem is ill-conditioned, or each gradient
is expensive. Pretraining is the first regime. Fine-tuning, scientific ML and federated learning are
the second. The field optimised hard for the first and under-invested in the second.

## 2. Training at scale is a different problem

Once a model does not fit on one device, the optimization problem acquires a systems constraint, and
the constraint starts dictating the mathematics.

**Optimizer state is the memory problem, not the weights.** Adam stores two moment estimates per
parameter. In mixed precision with master weights you are at roughly 16 bytes per parameter: a 7B
model needs about 112 GB before activations. **ZeRO** and FSDP shard optimizer state, gradients and
parameters across devices, trading communication for memory. That is a constrained optimization
problem about the training system, solved by engineers, and it determines what is trainable.

**Gradient accumulation and large-batch training** change the statistics. Beyond a critical batch
size, more samples per step stop buying proportionally better gradient estimates, and the right
response is a learning-rate rule (linear scaling, LARS/LAMB layer-wise adaptation) derived from that
noise structure.

**Communication-efficient distributed optimization**, gradient compression, quantised updates,
error feedback, local SGD, is a well-developed theory about how much you can corrupt a gradient
before convergence degrades. Federated learning is the extreme case: data cannot move at all, so
communication rounds become the scarce resource.

## 3. Alignment is constrained optimization

This is where the problem structure changes most, and it is the part people find most surprising.

**RLHF.** You want a policy $$\pi$$ that scores well under a learned reward $$r$$ without drifting
far from the reference model:

$$\max_{\pi}\; \mathbb{E}_{\pi}\!\left[r(x,y)\right] - \beta\, \mathrm{KL}\!\left(\pi \,\|\, \pi_{\text{ref}}\right)$$

That is a **KL-regularised policy optimization** problem. PPO solves it with a clipped surrogate
objective and a trust-region flavour, for a reason familiar from classical optimization: a step that
is too large in policy space produces a catastrophically wrong policy, so you constrain step size in
a distributional metric rather than in parameter space.

**DPO** is the part a optimization person should find elegant. The constrained problem above has a
**closed-form optimal policy** in terms of the reward. Invert that relation and the reward model
disappears; you are left with a simple classification loss on preference pairs. No reward model, no
RL loop, no rollouts. It is the same optimization problem, re-parameterised until it becomes
convex-ish supervised learning.

There is a real lesson there. A substantial fraction of progress in "AI methods" is **reformulation**
finding a change of variables under which a hard problem becomes an easy one. That is what
optimization training teaches you to look for, and it transfers.

**GRPO and the reasoning-model wave** replace the learned reward with a verifiable one (did the
program run? is the proof valid?) and estimate advantages from groups of sampled completions. The
optimization structure is similar; the reward being verifiable changes the variance properties
substantially.

**Constrained alignment.** Multiple objectives (be helpful, be harmless, be honest) is
multi-objective optimization, usually handled as a Lagrangian with learned multipliers. The theory
here is classical and the practice is not yet mature.

## 4. Generative models: the objective is the design choice

**Diffusion models** are trained with a denoising objective, predict the noise added at a random
timestep: which is a tractable surrogate for an intractable likelihood. The *training* problem is
plain supervised regression and well behaved.

The interesting optimization is at **sampling** time. Generation means integrating a reverse-time
SDE, or its deterministic probability-flow ODE, from noise to data. That is numerical analysis, not
learning: DDIM, DPM-Solver and the exponential-integrator family are **ODE solvers** exploiting the
semi-linear structure of the flow. Going from 1,000 sampling steps to 20 was a numerical-methods
advance, not a modelling one.

Then there is **distillation** (consistency models, progressive distillation) which pose the
question "can a one-step map approximate the solution operator of this ODE?" as an optimization
problem in its own right.

**Flow matching** reframes generation as learning a velocity field transporting one distribution to
another, which puts **optimal transport** directly into the objective. Straighter transport paths
mean fewer integration steps, so the optimization and the sampling cost are coupled by design.

**Normalising flows and VAEs** trade expressiveness against tractability of the likelihood: a
constrained design problem, where the constraint is "the Jacobian determinant must be computable".

## 5. Inference-time optimization: now the expensive one

A frontier model is trained once and served billions of times. The economics moved, and so did the
interesting problems.

**Quantisation.** Represent weights and activations in 4 or 8 bits with minimal quality loss. This is
genuinely a constrained optimization problem: minimise output deviation subject to a bit budget.
GPTQ solves a layer-wise reconstruction problem using second-order information, approximate Hessians
of the layer output with respect to weights, which is exactly the curvature machinery from §1 applied
to compression. AWQ exploits the empirical fact that a small fraction of channels matter
disproportionately, which is a **sparsity structure** in the solution.

**Pruning.** Which weights can be removed? Classical formulations (Optimal Brain Surgeon) use the
Hessian of the loss to estimate the damage from removing each weight; modern structured pruning
removes whole heads or channels under a hardware-shaped constraint, because unstructured sparsity
does not speed anything up on a GPU.

**Speculative decoding.** A small draft model proposes tokens, the large model verifies in parallel.
Choosing draft length is a sequential decision problem under uncertainty, accept-rate against
verification cost, and the right draft length is not constant across a sequence.

**KV-cache management, continuous batching, paged attention.** Scheduling and allocation problems:
which requests to batch, which cache blocks to evict, how to page attention memory. Classic
combinatorial optimization, worth enormous amounts of money, and mostly solved by good heuristics
rather than by anything principled.

**Mixture-of-experts routing.** Assign tokens to experts subject to capacity constraints: a
**balanced assignment problem**. Some implementations use Sinkhorn iterations, i.e. entropy-regularised
optimal transport. Most use a cheap top-$$k$$ with an auxiliary load-balancing loss, which is the
constraint relaxed into a penalty because the exact version is too slow.

## 6. Discrete and combinatorial optimization inside the models

**Decoding is search.** Finding the most likely sequence under an autoregressive model is a
combinatorial problem over an exponentially large tree. Greedy decoding and beam search are
heuristics; sampling is a deliberate choice not to optimise. Constrained decoding, enforce this
grammar, match this JSON schema, is combinatorial search under constraints, solved with masks and
automata.

**Tree search for reasoning.** Monte Carlo Tree Search over reasoning steps, with the model as both
policy and value function, is AlphaZero's machinery applied to text. The exploration-exploitation
problem is the same, and UCT and PUCT are the same bandit algorithms.

**Attention sparsity patterns, architecture search, operator scheduling.** Which tokens attend to
which; which operators to fuse; how to tile a matrix multiplication for a particular memory
hierarchy. The last one is an integer program that compilers solve with heuristics, and it is where a
large fraction of real-world speedup comes from.

## 7. Optimization *of* the pipeline

**Hyperparameter optimization.** Each evaluation costs a training run, so you have an expensive
black-box problem: the native setting for **Bayesian optimization**: fit a surrogate (usually a
Gaussian process or a tree ensemble), use an acquisition function to decide where to look next.
Hyperband and ASHA add early stopping, which turns it into a **bandit** problem with partial
information.

A detail I care about, having worked on it: the literature mostly counts *iterations*, while real
campaigns are limited by *spend*, and different configurations cost different amounts. Counting the
wrong resource changes which method looks best. I wrote about that
[here](/blog/2026/when-every-experiment-has-a-price/).

**Data selection and curriculum.** Which examples to train on, in what order, is a combinatorial
problem over subsets with a submodular flavour, and at frontier scale it is one of the highest-
leverage decisions available, because it changes the quality of every subsequent step.

**Neural architecture search.** Discrete search over architectures, usually relaxed to continuous
(DARTS) to make gradients available: the standard **convex-relaxation** move from classical discrete
optimization, applied to architecture.

## 8. What is well solved, and what is not

**Well solved**
- Convex problems, at essentially any scale that matters
- First-order stochastic optimization for over-parameterised models
- Distributed data-parallel training, as engineering
- Layer-wise post-training quantisation

**Not solved**
- **Second-order methods at scale.** Everything used is a diagonal or block approximation. The gap
  between what curvature could give and what we can afford is still wide, and it is where I think
  the most under-exploited leverage sits.
- **Non-convex theory that predicts practice.** We have rates under assumptions nobody verifies.
  The reason Adam beats SGD on transformers is not settled.
- **Data selection**, in any principled sense.
- **Inference scheduling**, enormous economic value, almost entirely heuristic.
- **Multi-objective alignment**, where the Pareto structure is barely characterised.
- **Non-myopic sequential decision-making** under realistic budgets: the theory is clear and the
  practice usually does not pay, for reasons that are not well understood.

## Why this map is worth having

Two reasons, and the second is the one I would argue for.

The first is practical: when you can see which of these problems you are actually facing, you know
which literature to read. A badly-conditioned fine-tune, a sampling bottleneck and a serving
scheduler are three different problems, and recognising which one you have saves weeks.

The second is that **the structure transfers and the application does not**. KL-constrained policy
optimization is a trust region. Quantisation is constrained approximation with second-order error
estimates. MoE routing is balanced assignment. Diffusion sampling is ODE integration. Decoding is
tree search. Someone who knows the structure can walk into a new application and recognise the
problem: which is, in the end, what a mathematical-optimization training is for.
