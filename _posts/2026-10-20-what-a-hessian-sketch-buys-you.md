---
layout: post
title: What a Hessian sketch actually buys you
date: 2026-10-20 09:00:00+0900
description: Second-order optimization is fast and nobody uses it. Here is the arithmetic of why, and what changes if you only look at 10% of the matrix.
tags: optimization second-order
categories: optimization
giscus_comments: false
related_posts: true
---

Every introduction to optimization tells you the same two things. Gradient descent is cheap and
slow. Newton's method is expensive and fast. Then almost every practitioner uses the cheap one and
spends the savings on hyperparameter tuning.

That is the right call more often than the textbooks imply. But it is worth understanding exactly
*what* is expensive, because the expensive part is narrower than people assume, and once you know
which term dominates, you can go after it.

## The arithmetic

Suppose you are minimising a loss over $$d$$ parameters using $$n$$ data points.

**Gradient descent** needs the gradient: one pass over the data, $$O(nd)$$ per step. It tells you
which direction is downhill.

**Newton's method** also wants the Hessian: the $$d \times d$$ matrix of second derivatives, which
tells you how the slope is *changing*. Forming it costs $$O(nd^2)$$, and solving the linear system
$$H \delta w = -g$$ costs $$O(d^3)$$.

That $$d^3$$ is the problem. At $$d = 1{,}000$$ it is a billion operations, annoying. At
$$d = 10{,}000$$ it is $$10^{12}$$: a non-starter, and $$10{,}000$$ parameters is a small model by
any modern standard.

So the field went sideways instead. **L-BFGS** keeps a short history of gradient differences and
builds an implicit curvature estimate from them, never forming a matrix at all. It works
remarkably well, and it is still the default when someone needs a second-order method at scale.

## The question worth asking

L-BFGS infers curvature from first-order information, from how the gradient has changed over the
last few steps. That is clever, and it is also indirect: the secant equation it relies on becomes a
poor proxy for the Newton step precisely when the problem is badly conditioned, which is when you
wanted curvature in the first place.

So: **is there a way to use the actual Hessian without paying for all of it?**

## Sketching

Here is the idea. Do not compute the whole Hessian. Sample $$m$$ of its columns, where
$$m \ll d$$, say 10% of them. Now you have a $$d \times m$$ slice of the matrix.

A $$d \times m$$ slice is not a $$d \times d$$ matrix, but the **Nyström method** lets you
reconstruct an approximation of the whole thing from it. The construction is old. It comes from
numerical integration, and it is the same machinery behind low-rank kernel approximation. The
cost comes out as

$$O(ndm + dm^2)$$

instead of $$O(nd^2 + d^3)$$. With $$m = 0.1d$$, the $$d^3$$ term becomes $$0.01 d^3$$, and the
$$nd^2$$ term becomes $$0.1 nd^2$$. Not a constant-factor win: an order-of-magnitude one, and it
gets better as $$d$$ grows.

In the experiments in [our papers](/publications/), $$m$$ between 5% and 20% of $$d$$ was enough to
get most of the benefit. You can also skip forming the approximation entirely and compute the update
$$\delta w$$ directly, so neither the full Hessian nor its inverse is ever stored.

## The part that nearly kills it

Everything above works on convex problems. Then you try it on a neural network.

On a non-convex objective the Hessian is **indefinite**: it has negative eigenvalues, because you
are sitting near a saddle rather than a bowl. A direction built from an indefinite matrix is not
guaranteed to point downhill at all. Your optimizer confidently takes a step that increases the
loss.

Worse, the low-rank approximation does not save you. It inherits the problem: approximate an
indefinite matrix and you get an indefinite approximation.

The fix is unglamorous and it is the reason the method works: **regularize the sketch**. Add a
multiple of the identity, chosen so the result is positive definite. Now the direction is a descent
direction by construction, you get a usable step, and you can prove global convergence.

That is the whole contribution, really. The Nyström part is classical. Making it survive contact
with a non-convex loss is the part that took the work.

## When not to do this

I want to be straightforward about this, because optimization papers are not always.

- **If $$d$$ is small, use Newton.** The sketch is machinery for avoiding a cost you are not paying.
- **If your gradients are very noisy** (tiny batches, high-variance estimator) curvature estimated
  from that noise is worse than no curvature. A well-tuned first-order method wins, and it is
  simpler.
- **If your problem is well conditioned,** gradient descent is already close to optimal and the
  extra complexity earns nothing.
- **You have to choose $$m$$.** It is a real hyperparameter, the method is sensitive to it, and the
  right value is problem-dependent. You can study the trade-off, approximation error against $$m$$,
  convergence against $$m$$, and we did, but the study informs the choice rather than removing it.

The honest summary: this is a method for **large $$d$$, ill-conditioned problems where you can
afford a full-batch or large-batch gradient**. That is a real and recurring setting, and it is not
every setting.

## Why I still think the direction matters

The ratio between what we spend on gradients and what we learn from them is bad, and it is getting
worse as models grow. Every result that makes curvature information cheaper moves that ratio. Not
all of them will matter; a sketch that works at $$d = 10^4$$ is not automatically a sketch that
works at $$d = 10^{10}$$, and I would not claim otherwise without running it.

But the arithmetic at the top of this post is not going away, and $$d^3$$ is a term worth attacking.

*The methods here are from [NysReg-Gradient](/publications/) (IJCNN 2026) and the non-convex
preprint. MATLAB experiment code is at [`Nys_Reg`](https://github.com/hardy-opt/Nys_Reg); a PyTorch
implementation is in preparation.*
