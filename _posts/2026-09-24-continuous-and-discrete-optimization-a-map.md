---
layout: post
title: "Continuous and discrete optimization: a working map"
date: 2026-11-24 09:00:00+0900
description: The two halves of mathematical optimization, what separates them, which methods belong where, how to tell which kind of problem you actually have, and where the two meet.
tags: optimization math
categories: optimization
giscus_comments: false
related_posts: true
toc:
  sidebar: left
---

Almost every optimization problem reduces to the same three objects: **variables** you can choose,
an **objective** to make small, and **constraints** that say which choices are allowed.

$$\min_{\mathbf{x}\in\mathcal{X}} \; f(\mathbf{x}) \quad \text{subject to} \quad g_i(\mathbf{x}) \le 0, \quad h_j(\mathbf{x}) = 0$$

What determines whether the problem takes a second or a century is the structure: whether
$$\mathcal{X}$$ is continuous or discrete, whether $$f$$ is convex, whether you can compute
derivatives, and whether the data is known or random.

The single biggest fork is **continuous versus discrete**, and the practical difference is larger
than the notation suggests. This post is the map I wish I had been given early: what lives on each
side, which methods belong where, how to diagnose which kind of problem you have, and what happens
at the border: which is where most interesting applied work actually sits.

# Part I · Continuous optimization

Variables are real-valued. You can take derivatives, make arbitrarily small steps, and ask what
happens in a neighbourhood. The local geometry is informative, which is what makes the whole theory
possible.

## The dividing line: convexity

**A convex problem has a convex objective over a convex feasible set.** Its consequence is the most
useful single fact in optimization:

> **Every local minimum is global, and there is a certificate that you have found it.**

So "did I find the answer?" has a yes-or-no answer. For convex problems with structure we have
polynomial-time algorithms, mature solvers, and duality theory that turns the question "is this
optimal?" into an arithmetic check. Convex optimization is, for practical purposes, a solved
technology.

Non-convex is everything else, and the honest summary is that you are looking for a *good* point
rather than *the* point. What we have are methods that reliably find stationary points, plus
empirical knowledge about which landscapes are forgiving. Deep learning is the famous case where
non-convexity turned out to matter far less than everyone feared.

## The conic hierarchy

Convex problems come in a nested family, and knowing where yours sits tells you which solver to use:

| Class | Objective / constraints | Example |
|---|---|---|
| **LP** | linear / linear | production planning, network flow, diet problem |
| **QP** | quadratic / linear | portfolio variance, SVM dual, MPC |
| **SOCP** | linear / second-order cone | robust LP, facility location with distances |
| **SDP** | linear / positive-semidefinite | relaxations of hard combinatorial problems, control |

Each contains the one above it. The interesting fact is that **interior-point methods** solve all of
them with essentially one algorithmic idea (follow a central path toward the boundary) which is
why a single solver can handle the whole hierarchy.

## Unconstrained methods, and what each one buys

Everything here is a different answer to: *how much do you know about the local shape?*

**Gradient descent**, $$\mathbf{x}_{k+1} = \mathbf{x}_k - \alpha\nabla f(\mathbf{x}_k)$$. Uses the
slope only. Cheap, and slow when the problem is badly conditioned: the convergence rate degrades
with the condition number, which is why a long narrow valley makes it zig-zag.

**Momentum / Nesterov acceleration**, accumulate past directions. For convex problems this
improves the rate from $$O(1/k)$$ to $$O(1/k^2)$$, and that is provably the best a first-order method
can do. Acceleration is not a trick; it is a matching upper bound.

**Newton's method**, $$\mathbf{x}_{k+1} = \mathbf{x}_k - \mathbf{H}^{-1}\nabla f$$. Uses curvature.
Quadratic local convergence; condition number stops mattering because you are rescaling by the
geometry itself. Costs $$O(d^3)$$ per step, and on a non-convex problem $$\mathbf{H}$$ can be
indefinite, in which case the "descent" direction goes uphill.

**Quasi-Newton (BFGS, L-BFGS)**, build a curvature estimate from successive gradients via the secant
equation. The practical sweet spot for medium-scale smooth problems, and L-BFGS's limited memory makes
it workable at high dimension. Its weakness: the estimate is built from gradient *differences*, so
with stochastic gradients you are differencing noise.

**Trust-region and line-search methods**, two ways to answer "how far should I step?". A line search
picks the step length along a fixed direction; a trust region fixes a radius you trust the model
within and optimises inside it. Trust regions are more robust on non-convex problems, because they
handle indefinite curvature gracefully instead of needing a fix.

**Sketched and randomized second-order methods**, compute curvature on a random subspace. Sample
$$m \ll d$$ Hessian columns and reconstruct via the Nyström method, bringing cost from
$$O(nd^2 + d^3)$$ to $$O(ndm + dm^2)$$. This is [my own area](/research/); the design problem is
getting a usable descent direction out of a low-rank approximation of a possibly indefinite matrix,
which regularisation solves.

**Derivative-free methods** (Nelder-Mead, pattern search, CMA-ES): when there is no gradient:
simulation output, a physical experiment, a black box. Slow and sometimes the only option.

**Bayesian optimization**: when evaluations are *expensive* as well as derivative-free. Build a
probabilistic surrogate, use an acquisition function to choose the next point. Dozens of evaluations,
not thousands.

## Constrained methods

**KKT conditions** generalise "the gradient is zero" to constrained problems: at an optimum, the
objective gradient is a combination of active constraint gradients. The multipliers are **shadow
prices** (how much the optimum would improve if a constraint were relaxed) which is often more
useful to a practitioner than the solution itself.

**Lagrangian duality** turns the constrained problem into an unconstrained one in the multipliers.
The dual is always a lower bound; for convex problems the gap is zero. That gap is what lets you
*certify* optimality.

**The main families:**
- **Interior-point**, add a barrier that blows up at the boundary, shrink it. Workhorse for convex
  problems at scale.
- **Active-set**, guess which constraints bind, solve the equality-constrained problem, repeat.
- **Augmented Lagrangian / ADMM**, penalise violation and update multipliers. ADMM splits a problem
  into pieces that are each easy, and is the reason so much distributed and federated optimization is
  built on it: the splitting maps onto the machines.
- **Projected and proximal gradient**, step, then project back into the feasible set. The proximal
  version handles non-smooth terms, which is what makes $$\ell_1$$ regularisation tractable and gives
  you sparsity.

## Stochastic optimization

When the objective is an expectation, over data, or over genuine randomness:

$$\min_{\mathbf{x}} \; \mathbb{E}_{\xi}\left[F(\mathbf{x},\xi)\right]$$

**SGD** replaces the gradient with a cheap unbiased estimate. The variance of that estimate, not the
curvature, sets the convergence rate: which is a different world from the deterministic case and
calls for different methods.

**Variance reduction** (SVRG, SAGA, SARAH) uses a control variate, typically a periodically
refreshed full gradient, to cut the noise, recovering linear convergence on strongly convex
problems. My [JIMO paper](/publications/) sits here: using Barzilai-Borwein step sizes as cheap
second-order information inside SVRG, where "cheap" means the gradients were already computed.

**Robust and chance-constrained optimization** handle uncertainty differently, optimise the worst
case over an uncertainty set, or require constraints to hold with probability $$1-\epsilon$$. Often
the right framing in engineering, where a constraint violation is a failure rather than a cost.

# Part II · Discrete optimization

Variables take values in a finite or countable set: integers, binary choices, permutations, subsets,
graph structures. Scheduling, routing, assignment, network design, and most of operations research.

## Why it is categorically harder

There is **no local geometry**. You cannot take a derivative of a decision. You cannot take a small
step, flipping one binary variable may be the only move available, and it may be a large change. A
solution can be optimal among all its neighbours and far from the global optimum, with nothing local
to indicate it.

And the problems are genuinely hard: TSP, knapsack, set cover, graph colouring are **NP-hard**, so
barring a complexity surprise there is no polynomial algorithm. This is not a gap in our knowledge of
algorithms; it is believed to be a property of the problems.

So the discipline changes. In continuous convex optimization you ask *"what is the optimum?"*. In
discrete optimization you ask one of:

- *What is the best solution I can find in the time available?* (heuristics)
- *How far from optimal might I be?* (bounds and gaps)
- *Can I prove optimality for instances of this size?* (exact methods)

## Exact methods

**Branch and bound** is the core idea and it is beautiful in its simplicity. Relax the integrality
constraint and solve the easy continuous problem. That gives a **bound**. If the relaxed solution
happens to be integral, you are done. Otherwise pick a fractional variable and branch: one subproblem
with $$x \le \lfloor v \rfloor$$, one with $$x \ge \lceil v \rceil$$. Recurse. Any subtree whose bound
is worse than the best solution found is **pruned** without being explored.

The whole art is making the bound tight, because a tight bound prunes aggressively and a loose one
makes you enumerate.

**Cutting planes** tighten the relaxation by adding valid inequalities that cut off fractional
solutions without removing any integer point. **Branch and cut** (doing both) is what every modern
MILP solver actually is, and why Gurobi and CPLEX routinely solve problems with hundreds of thousands
of integer variables that are "NP-hard" in the textbook sense. The theory says worst case; the solvers
exploit structure.

**Dynamic programming** works when the problem has optimal substructure: shortest paths, knapsack,
sequence alignment. Exact and polynomial *in the state space*, and the state space is usually what
explodes.

**Constraint programming** takes a different route: propagate constraints to shrink variable domains,
search what remains. Often dominant on scheduling and rostering, where the constraints are complex
and combinatorial rather than numerical.

**SAT and SMT solvers** reduce the problem to Boolean satisfiability. Modern CDCL solvers handle
millions of clauses, which is one of the genuinely surprising engineering achievements in computing.

## When exact is out of reach

**Approximation algorithms** come with a proven guarantee, within a factor of optimal, always. The
greedy algorithm for set cover is within $$\ln n$$; for submodular maximisation under a cardinality
constraint, greedy achieves $$1 - 1/e$$ and that is provably the best possible. A guarantee is worth
a great deal in a setting where you otherwise have no idea how good your answer is.

**Metaheuristics** have no guarantee and often work well: simulated annealing (accept worse
solutions with decreasing probability, borrowed from statistical physics), tabu search (forbid
recent moves to escape local optima), genetic and evolutionary algorithms, ant colony optimization,
large neighbourhood search. The last is the most practically effective for routing: destroy part of
a solution and rebuild it optimally.

**Heuristic search**, A\*, best-first, beam search, Monte Carlo Tree Search. Here the **heuristic
function** is everything: a good admissible heuristic can turn an intractable search into a
quick one, and the whole engineering problem becomes estimating cost-to-go well. I work on exactly
this in my current role, in a combinatorial AND/OR search setting.

# Part III · Where the two halves meet

Most interesting applied problems live here, and this is the part that pure-continuous or
pure-discrete training leaves out.

**Relaxation.** Drop integrality, solve the continuous problem, and you get a bound plus a starting
point. This is the engine inside branch and bound, and it is why discrete optimization depends so
heavily on continuous optimization being fast.

**LP relaxation and rounding.** Solve the LP, round the fractional solution, prove the rounding costs
you at most a factor. Randomised rounding gives some of the best known approximation guarantees.

**Semidefinite relaxation.** The Goemans-Williamson algorithm for MAX-CUT relaxes a binary quadratic
problem to an SDP and rounds with a random hyperplane, achieving 0.878 of optimal. A continuous,
convex relaxation of an NP-hard discrete problem, with a proven guarantee, one of the most elegant
results in the field.

**MINLP.** Both continuous and discrete variables with nonlinear functions: chemical process design,
unit commitment in power systems, portfolio problems with transaction lots. Genuinely hard, and
exactly what industrial problems look like.

**Decomposition.** **Benders** splits a problem into a master problem over the discrete variables and
subproblems over the continuous ones, iterating by passing cuts. **Dantzig-Wolfe** and column
generation do the dual thing (generate variables on demand) and are how vehicle routing and crew
scheduling are solved at airline scale.

**Submodularity** is the closest discrete analogue of convexity. Diminishing returns on sets gives
you provable guarantees for greedy algorithms, and it shows up in sensor placement, feature
selection, summarisation and data selection.

**Optimal transport** sits precisely on the boundary. The discrete problem is an assignment problem
a linear program with integral optimal solutions by total unimodularity. The entropy-regularised
continuous version is solved by Sinkhorn iterations in a few lines, which is why OT became practical
in machine learning.

# How to tell which problem you have

A decision procedure I actually use:

**1 · Are the decisions divisible?** "How much" is continuous; "which one", "how many", "yes or no"
is discrete. Mixing both means MINLP, and you should expect difficulty.

**2 · Can you compute a gradient?** Analytically or by automatic differentiation, use a first- or
second-order method. If not, is each evaluation cheap (derivative-free) or expensive (Bayesian
optimization)?

**3 · Is it convex?** Check the composition rules rather than guessing: affine functions, norms,
max of convex functions, and compositions respecting curvature and monotonicity. If it is convex, say
so and use the right solver, you get a certificate of optimality, which is worth a lot.

**4 · How large, and in what dimension?** $$10^3$$ variables and $$10^9$$ variables are different
engineering problems with the same mathematics. For discrete problems, ask instead how large the
*relaxation gap* is, that, not the variable count, predicts whether branch and bound will finish.

**5 · Is the data known?** Deterministic, stochastic (optimise an expectation), or robust (optimise
the worst case) are three different problems with the same description in words, and choosing the
wrong one is a common and expensive mistake.

**6 · What resource is actually scarce?** Time, memory, communication rounds, instrument hours,
money. This determines what you are really minimising, and it is the question most often skipped
including in the academic literature, which tends to count iterations because iterations are easy to
count.

# Software worth knowing

| Need | Tools |
|---|---|
| LP / MILP / QP | Gurobi, CPLEX, HiGHS (open), SCIP, CBC |
| Convex modelling | CVXPY, JuMP, MOSEK |
| Nonlinear | IPOPT, SNOPT, KNITRO, `scipy.optimize` |
| Constraint programming | OR-Tools CP-SAT, Gecode |
| SAT / SMT | MiniSat, CaDiCaL, Z3 |
| Metaheuristics | OR-Tools routing, LocalSolver |
| Bayesian optimization | BoTorch, Optuna, Ax |
| Deep-learning optimizers | PyTorch `torch.optim`, Optax |
| Benchmarking | CUTEst, MIPLIB, TSPLIB |

A practical note: CP-SAT is now extremely strong on scheduling and rostering, and is often the right
first attempt for problems people reflexively model as MILP.

# Why both halves are worth knowing

I was trained in continuous optimization, my thesis was second-order methods for large-scale
unconstrained problems, which is about as continuous as it gets. Industrial problems have not
respected the boundary once.

A real problem arrives as *"schedule these experiments on this instrument within this budget"*, and
it contains a continuous surrogate model, a discrete selection, and a resource constraint, all at
once. The continuous theory tells you how to fit the surrogate and how fast you can descend. The
discrete theory tells you that selection is a search and that a good bound beats a clever heuristic.
The boundary techniques (relaxation, decomposition, submodularity) are how the two get connected.

Knowing only one half means reaching for the wrong tool roughly half the time, and the failure is
quiet: you get an answer, it is plausible, and you never learn it was the wrong formulation.

*Related: [where optimization lives in modern AI](/blog/2026/where-optimization-lives-in-modern-ai/)
· [what a Hessian sketch actually buys you](/blog/2026/what-a-hessian-sketch-buys-you/)
· [my research](/research/)*
