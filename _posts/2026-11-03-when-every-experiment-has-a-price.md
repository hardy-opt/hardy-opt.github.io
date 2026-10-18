---
layout: post
title: When every experiment has a price
date: 2026-11-03 09:00:00+0900
description: Bayesian optimization is usually benchmarked in iterations. Laboratories do not run on iterations. What changes when you count cost instead.
tags: bayesian-optimization optimization
categories: optimization
giscus_comments: false
related_posts: true
---

Bayesian optimization answers a specific question: given what you have measured so far, what should
you measure next? It is the right tool when evaluations are expensive: a wet-lab experiment,
training a large model, a physical measurement that occupies an instrument for an hour.

Almost all of the published benchmarking counts **iterations**. Twenty evaluations, fifty, a hundred;
plot best-value-so-far against evaluation number; compare the curves.

That axis is wrong for most of the settings the method is sold for, and the gap is not subtle.

## Iterations are not the budget

A laboratory does not have an iteration budget. It has instrument hours, reagents, technician time
and bookings. A compute cluster has node-hours and a quota. And critically, **different evaluations
cost different amounts**: a coarse scan and a fine scan are not the same purchase, and the
acquisition function that proposes them does not know the difference unless you tell it.

Two consequences follow immediately, and the iteration-counting literature mostly skips both.

### A policy that wins per iteration can lose per unit cost

If method A reaches a good value in 30 evaluations and method B takes 45, A wins the usual plot. But
if A's proposals are systematically expensive (it likes the settings that take an hour) and B's are
cheap, B may reach the same value for half the spend. On the axis that matches the actual constraint,
B is better. On the axis in the paper, A is.

This is not hypothetical and it is not news: cost-aware acquisition has been studied since at least
the *expected improvement per second* work in the early 2010s, and there is a steady line of
follow-up on cost-aware and multi-fidelity variants. What has not really followed is the
**benchmarking convention**. Most comparisons still count steps.

### A campaign can simply fail to finish

This one I find more interesting, because it is a failure mode rather than a suboptimality.

Suppose your remaining budget is small, and the acquisition function: which knows nothing about
money, proposes the most informative experiment available, which happens to be expensive. You
cannot afford it. Now what?

Options are all bad. Run it anyway and overspend. Refuse it and have the loop propose the same thing
again. Fall back to something arbitrary. Stop early.

So "how well did the policy do?" is not a well-formed question. The well-formed version has two
parts: *what did it achieve*, and *did the campaign complete within its budget*. A policy with
excellent final regret that only finishes 3 campaigns out of 29 is not a good policy. It is a policy
you cannot deploy.

I have not often seen **completion rate** reported as a metric. It should be.

## What a budget-aware loop actually needs

Making this structural rather than reported-after-the-fact takes three pieces:

**A cost model.** A function $$c(x)$$ giving the price of evaluating at $$x$$. Sometimes you can fit
it from historical runs; sometimes it is known in closed form. Whether it is closed form matters more
than it sounds: if it is, the **set of affordable points is known exactly before you spend anything**,
so the constraint can be applied inside the acquisition optimization rather than checked afterwards.

**A ledger.** Something that tracks what has been spent, what remains, and refuses a proposal it
cannot pay for. Boring, and it is the component that makes everything else honest.

**A constrained acquisition step.** Not "maximise expected improvement, then check the price"
*maximise expected improvement over the affordable set*. The difference shows up exactly at the end
of a campaign, where the behaviour matters most.

There is also a constraint that is easy to miss: a real instrument is often booked in **slots**, so
there is a cap on what a *single* evaluation may consume, separate from the total. That is a
restriction on the problem rather than a new policy, and it changes which policies win.

## Does looking further ahead help?

The natural next thought is non-myopia. A greedy acquisition function optimises the next evaluation.
If you can afford three more, shouldn't you plan all three, maybe spend on something cheap and
informative now to enable a better choice later?

In theory, clearly yes; the fully non-myopic problem is a dynamic program and the greedy policy is a
one-step approximation to it. In practice the lookahead costs real compute, it compounds surrogate
error over the horizon, and the two-step version is usually the only tractable one.

My honest expectation, before measuring, would be that **two-step lookahead frequently does not pay**
at realistic budgets, and that when it does not, the reason is in the surrogate's uncertainty
estimates rather than in the planning. That is a testable claim and it is the kind of thing worth
publishing either way: a negative result with a mechanism tells you where to look next, which a
positive result on a synthetic benchmark often does not.

## Why I think the framing is the contribution

None of the ingredients here is new. Cost-aware acquisition is established; non-myopic BO has a
literature; ledgers are bookkeeping.

What seems genuinely underserved is the **evaluation convention**, reporting regret against
cumulative cost rather than iteration count, and reporting completion rate as a first-class metric
alongside final value. Those two changes are cheap, they do not require a new algorithm, and they
change which methods look good.

I am building a public benchmark on exactly this, on open synthetic test functions with cost models
defined in the open, so the comparison is reproducible on a laptop. When it is ready it will be
linked from [Projects](/projects/).

*Related reading: Snoek, Larochelle & Adams (2012) on expected improvement per second; Lam, Willcox
& Wolpert on non-myopic BO; and the cost-aware BO line that follows from both.*
