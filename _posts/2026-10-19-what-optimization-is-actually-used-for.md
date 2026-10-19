---
layout: post
title: What optimization is actually used for
date: 2026-10-19 09:00:00+0900
description: A tour of the fields that run on mathematical optimization, and in each case the specific thing being minimised, the structure that makes it hard, and the method that gets used.
tags: optimization math
categories: optimization
giscus_comments: false
related_posts: true
toc:
  sidebar: left
---

Lists of optimization applications are easy to write and useless to read. "Optimization is used in
logistics, finance and engineering" tells you nothing, because the interesting part is never *that*
a field uses optimization. It is **what quantity gets minimised, what structure makes the problem
hard, and which method survives contact with it**.

So this is a tour with that structure. For each area: the decision variables, the objective, the
constraint that causes the trouble, and what people actually run. The recurring lesson is that
problems which look unrelated turn out to have the same shape, and the method transfers even when
the vocabulary does not.

## Energy systems

**Unit commitment.** A grid operator decides, for each generator and each hour of tomorrow, whether
it runs and at what output. The objective is total fuel and start-up cost. The difficulty is that
"is this plant on?" is **binary**, while "how much is it producing?" is continuous, and the binary
decisions carry awkward constraints: a thermal plant that shuts down cannot restart for hours, and
it cannot ramp faster than some rate.

That mixture makes it a **mixed-integer program**, and it is solved overnight, every night, by every
major grid operator using branch and cut. It is probably the largest standing industrial MILP
workload in existence. Modern versions add renewables, which turns the demand and supply into random
variables and pushes the formulation toward **stochastic** or **robust** optimization: optimise
against a set of plausible wind forecasts rather than a single prediction.

**Optimal power flow.** Given the commitment, how should power actually flow through the network?
The physics (Kirchhoff's laws with AC power) makes this non-convex and genuinely hard. The practical
breakthrough was **convex relaxation**: a semidefinite or second-order-cone relaxation that is
solvable, together with conditions under which the relaxation is exact so the answer is provably the
true optimum. That is a textbook case of relaxation doing real work rather than just providing a
bound.

## Electronics and chip design

**Placement and routing.** Where do a few hundred million transistors sit on the die, and how are
they wired? Objective: minimise total wire length and delay. Constraints: nothing overlaps,
everything is routable, the design meets timing. The search space is astronomically large and the
problem is NP-hard many times over.

What is actually run is a layered pile of heuristics: analytic placement that relaxes positions to
continuous coordinates and solves a smooth problem, then **simulated annealing** or partitioning to
restore legality, then routing as a sequence of shortest-path problems on a grid. The continuous
relaxation step is doing exactly the same job as an LP relaxation inside branch and bound: it gives
a good starting point for a discrete problem.

**Circuit sizing.** Choosing transistor widths to hit a speed target at minimum power is, remarkably,
a **geometric program**: after a logarithmic change of variables it becomes convex, so it is solved
exactly. This is my favourite example of structure hiding in plain sight, because nothing about the
original problem looks convex until you make the substitution.

**Logic synthesis and verification** are satisfiability problems, run on SAT solvers. A modern chip
cannot be verified any other way.

## Drug discovery and chemistry

**Molecular design.** Find a molecule that binds a target, is soluble, is not toxic and can actually
be made. The search space is discrete, enormous (estimates of drug-like chemical space run to
$$10^{60}$$) and the objectives conflict, so this is genuinely **multi-objective combinatorial**
optimization.

In practice it is attacked from two directions. Generative models learn a continuous latent space in
which gradient-based search becomes possible, which is a relaxation of a discrete problem.
**Bayesian optimization** handles the expensive-evaluation regime, because each candidate may need a
synthesis and an assay. Both are then filtered by **Pareto** reasoning across the competing
properties rather than by a single score.

**Synthesis planning.** Given a target molecule, find a route from purchasable starting materials.
This is best-first search over an AND/OR graph, where the dominant cost is exploration and the
leverage sits entirely in the heuristic that orders the frontier. It is A\* with a learned
cost-to-go, and it is the problem I work on; I wrote about the structure
[here](/projects/1_retrosynthesis_search/).

**Protein structure and docking.** Minimise a physics-derived energy function over conformations.
Continuous, extremely non-convex, enormous numbers of local minima. Historically solved with
simulated annealing and molecular dynamics; now largely displaced by learned models, though the
energy minimisation still runs underneath as a refinement step.

## Logistics and operations

**Vehicle routing.** Which vehicle visits which customers, in what order, respecting capacity and
time windows? The classical NP-hard problem, and the one where exact methods genuinely reach
industrial scale: **column generation** treats each feasible route as a variable and generates only
the promising ones on demand, which is how airline crew scheduling is solved for real fleets.

For the largest instances, **large neighbourhood search** dominates: destroy part of a good solution
and rebuild that part optimally, repeatedly. It has no guarantee and it is extremely effective.

**Inventory and supply chain.** How much to stock, where, given uncertain demand. Stochastic
optimization, often as a multi-stage problem where decisions are made before the uncertainty
resolves. **Benders decomposition** splits the "where to build warehouses" integer decisions from
the "how much to ship" continuous ones.

**Scheduling.** Jobs on machines, staff on shifts, trains on tracks. Constraint programming is
frequently stronger here than MILP, because the constraints are structural (this nurse cannot work
two nights running) rather than numerical, and propagation prunes the space far faster than a
linear relaxation does.

## Finance

**Portfolio selection.** Markowitz's formulation, maximise return minus a multiple of variance, is a
**quadratic program** and was one of the first real applications of convex optimization. The honest
difficulty is not the optimization; it is that the covariance estimate is noisy, so the optimum is
unstable. The response is **robust optimization**: optimise the worst case over a set of plausible
covariance matrices, which produces portfolios that survive their own estimation error.

Add realistic constraints, a limit on the number of holdings, minimum lot sizes, and it becomes
mixed-integer. Add transaction costs and it becomes a multi-period problem.

**Option pricing and calibration.** Fit model parameters so computed prices match the market. A
non-linear least-squares problem, typically solved with Levenberg-Marquardt, which interpolates
between gradient descent and Gauss-Newton exactly as a trust-region method does.

## Transport and civil engineering

**Traffic assignment.** How does traffic distribute across a network when every driver picks their
own fastest route? The equilibrium is the solution of a convex optimization problem, which is a
genuinely surprising result: selfish individual behaviour has a variational characterisation. It is
also the basis of congestion pricing, because the gap between the selfish equilibrium and the social
optimum is computable.

**Structural design.** Minimise the mass of a structure subject to stress and displacement limits.
**Topology optimization** relaxes "is there material at this point?" from binary to a continuous
density in $$[0,1]$$, solves the smooth problem, then penalises intermediate values back toward
binary. The organic-looking brackets you see in additive manufacturing are outputs of this method,
and the relaxation-then-penalisation pattern is the same one used in chip placement.

## Medicine

**Radiation therapy planning.** Choose beam angles and intensities so the tumour receives a
prescribed dose while surrounding organs stay below their tolerances. Linear in the dose variables,
and genuinely **multi-objective**: tumour coverage against damage to each organ at risk. Clinicians
navigate the Pareto front interactively rather than accepting a single automated answer, which is
one of the better examples of multi-objective optimization used honestly.

**Medical imaging reconstruction.** Recover an image from incomplete measurements, as in accelerated
MRI. Posed as a convex problem balancing data fidelity against a sparsity prior, solved with
proximal methods. **Compressed sensing** theory gives conditions under which the reconstruction is
exact despite sampling below the Nyquist rate, which is why an MRI scan that used to take twenty
minutes can take five.

## Agriculture, manufacturing, and the unglamorous majority

**Blending and cutting-stock problems** are the oldest applications in the field and still run
daily. How do you mix feed to meet nutritional requirements at least cost (a linear program, the
original "diet problem"), and how do you cut shapes from stock material with minimum waste (an
integer program solved by column generation, where each cutting pattern is a variable)?

**Process control.** Model predictive control solves an optimization problem *at every timestep*:
over the next horizon, choose the control sequence that minimises deviation from target subject to
physical limits, apply the first move, then re-solve. Chemical plants, refineries and increasingly
vehicles run on this. The constraint is wall-clock: the problem must be solved faster than the
process evolves, which is why its convex structure matters so much.

## The pattern

Five structures account for most of this:

| Structure | Where it showed up above |
|---|---|
| **Convex relaxation of a discrete problem** | chip placement, topology optimization, optimal power flow, molecular latent spaces |
| **Low-rank approximation of a matrix you cannot build** | kernel methods, Hessian sketching, covariance estimation |
| **Decomposition into a master problem and subproblems** | crew scheduling, supply chain, unit commitment |
| **Expensive-evaluation sequential decisions** | drug discovery, materials, hyperparameter tuning, experiment design |
| **Pareto reasoning instead of a scalar objective** | radiation therapy, molecular design, model compression |

And the recurring practical lesson: **the hard part is usually the formulation, not the solver.**
Circuit sizing is easy once you know it is a geometric program and intractable if you do not.
Traffic equilibrium is a convex program that nobody would guess was one. A great deal of applied
optimization is recognising which of these five shapes you are holding.

That is also why the training transfers. Someone who has solved a scheduling problem and someone who
has sketched a Hessian have more in common than either has with a specialist in their own
application domain.

---

*Related: [where optimization lives in modern AI](/blog/2026/where-optimization-lives-in-modern-ai/)
· [continuous and discrete optimization: a working map](/blog/2026/continuous-and-discrete-optimization-a-map/)
· [my research](/research/)*
