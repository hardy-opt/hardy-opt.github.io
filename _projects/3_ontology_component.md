---
layout: page
title: A reproducible handover between two machine learning subsystems
description: An installable, versioned component that decides which molecular descriptors describe a property, and whose output is required by test to reproduce the validated result exactly. Project owner, MI-6 Co., Ltd.
img: assets/img/projects/contract-boundary.svg
importance: 3
category: work
related_publications: false
---

# When the interface is the hard part

Most machine learning problems are modelling problems. This one was not. It was about two
subsystems, owned by different people, that have to exchange a decision without that decision
quietly going stale.

> **Industrial R&D at MI-6 Co., Ltd., Tokyo.** I own this project and am the author of the package. The
> implementation, the chemical knowledge base and the internal data belong to my employer and are
> not published here. The engineering design below is what I can share, and it is the part worth
> discussing anyway.

### Contents
* [The setting](#the-setting)
* [The failure mode](#the-failure-mode)
* [The contract](#the-contract)
* [Four guarantees, each enforced by a test](#four-guarantees-each-enforced-by-a-test)
* [Representing what is not known](#representing-what-is-not-known)
* [A capability that was measured and then not used](#a-capability-that-was-measured-and-then-not-used)
* [Scope and limitations](#scope-and-limitations)
* [References](#references)

### The setting

To predict a chemical property with a machine learning model, you first have to decide what to
describe the molecules **with**. There are thousands of candidate molecular descriptors: counts of
structural features, electronic properties, topological indices, surface areas. Most are irrelevant
to any particular property, many are near-duplicates of each other, and the choice determines what
every downstream model can possibly learn.

This is a **subset selection** problem. Given a descriptor pool $$\mathcal{D}$$ and a budget $$k$$,
choose $$S \subseteq \mathcal{D}$$ with $$|S| = k$$ that best supports prediction of a target
property. The search space has $$\binom{|\mathcal{D}|}{k}$$ members, so it is combinatorial, and in
the general case it is NP-hard; every practical method is a heuristic with a justification.

The two usual families are **supervised selection**, which ranks descriptors by measured
association with the target, and **knowledge-driven selection**, which uses a structured
representation of what each descriptor physically means. The second has an obvious appeal: it can
explain *why* a descriptor was chosen, and it does not need labels. It also has an obvious problem,
which appears later in this page.

In our system the selection is made by one subsystem and consumed by another: a Bayesian
optimization engine that trains Gaussian process models and runs the experiment-proposal loop, owned
by a different team. The decision has to cross between them.

### The failure mode

Here is what goes wrong, and it goes wrong slowly enough that nobody notices.

An experiment establishes that a particular selection method works, and records a validated
number. A component is then built to produce that selection for everyone else to use. For a while
the two agree. Then the knowledge base is updated, or a default changes, or a dependency moves, and
the component starts producing something slightly different from what the experiment validated.

Both still run. Neither errors. Six months later a number in a slide deck is wrong, and nobody can
say when it stopped being right.

So the engineering question was not "which selection method is best?". It was:

> **How do you ship a component whose output is guaranteed, rather than believed, to equal the
> experiment that validated it?**

### The contract

The answer is an explicit, versioned artifact that crosses the boundary, and nothing else.

{% include figure.liquid loading="eager" path="assets/img/projects/contract-boundary.svg" class="img-fluid rounded z-depth-1" %}
<div class="caption">
The seam. Each side owns a clearly separated question, and exactly one versioned artifact passes
between them.
</div>

The component takes an endpoint and a descriptor budget, and returns an ordered list of
descriptors. Each carries the chemical signals it expresses, the confidence in that mapping, where
the mapping came from, and what it is redundant with. The specification also carries coverage
counts and a version number.

The boundary is drawn at a specific place: **deciding which descriptors an endpoint needs is
knowledge work; applying that selection inside a modelling pipeline is optimization work.** Naming
the line precisely is what makes it enforceable.

It ships as an installable Python package with a command line entry point, carrying its own
checksum-verified snapshot of the knowledge base as package data, with a deliberately minimal set
of runtime dependencies and nothing from the optimizer side. A colleague who wants an answer needs no clone and no access to the rest of the
system.

### Four guarantees, each enforced by a test

The point of this project is that none of the following is a claim in a document. Each is something
that fails loudly when it stops being true.

**The handover equals the validated result.** An end-to-end test regenerates the specification,
hands it to the consumer unchanged, re-evaluates on the same cross-validation folds, and requires
the held-out score to match the recorded value **bit for bit**. Not approximately. If the component
drifts from the experiment that validated it, the suite goes red.

**Determinism is designed in, not hoped for.** The timestamp is an input, never read from the
clock. Same knowledge state, same arguments, same timestamp gives byte-identical output. That is
what makes a specification diffable and a result traceable, and it is why the bit-for-bit test
above is even possible.

**The module boundary is enforced at process level.** A guard inspects the loaded modules of a
running process, twice: once after a library call and once after a real command line invocation,
and requires that no part of the optimizer was imported. The dependency manifest is checked the
same way. A boundary that exists only in a design document is one that has already been crossed.

**The published numbers gate themselves.** Continuous integration runs the suite on a clean machine
with no team checkout and no local data, which is the configuration a colleague cloning the
repository is actually in, and asserts every column of the result: zero errors, zero failures, and
the expected pass and skip counts. The documented numbers cannot say one thing while the suite says
another. They had previously drifted, which is why they are now gated.

One further test builds the wheel, installs it into a clean virtual environment outside the
repository with every relevant environment variable scrubbed, runs the command line tool, and
requires the output bytes to equal the committed reference. That is the claim "it runs standalone"
written as something that can fail.

### Representing what is not known

A detail I think is the most useful idea in the project, and it is a design decision rather than an
algorithm.

The knowledge base does not cover everything. A large majority of what the supervised comparison
baseline selects carries no knowledge label at all: the ontology genuinely has nothing to say about
it. The naive response is to return the descriptors it does know about, as a list.

That is wrong, because **an empty or short list looks exactly like an answer**. A caller cannot
distinguish "I examined this and found nothing" from "I was never asked" from "there is nothing to
find".

So the contract has graded confidence tiers, explicit coverage counts, and a dedicated **no answer**
state. A consumer can always tell which of those three situations it is in. This cost nothing to
design and it is the kind of thing that prevents a whole class of silent downstream error.

### A capability that was measured and then not used

One capability I built scores how far descriptor evidence gathered on one chemistry transfers to
another. The intuitive next step is to weight the selection by that score, preferring descriptors
whose evidence is likely to carry across.

We measured that against the unweighted version before adopting it, and the measurement did not
support adopting it. So nothing in the component weights by it. The capability ships as a diagnostic, with that result
attached to it. Building something, measuring it, and then declining to use it is an ordinary part
of research that rarely survives into a repository, and I think the record of it is more useful
than the feature would have been.

### Scope and limitations

- **It is not a product.** It has no external users and nobody buys it. It is internal research
  infrastructure, and calling it anything else would not survive one question.
- **Two chemical endpoints.** Nothing here generalises beyond them without being re-measured.
- **The predictive performance of the underlying models is not the contribution** and is not
  claimed as one. The contribution is the contract and its verification, and I would not present
  the selection method itself as a result.
- **Coverage is thin**, which is the honest reason the no-answer state exists.

### Why this project is on my site

Most of my work is algorithms. This one is interface design, release engineering and verification,
and it is the project I would offer as evidence that I can be handed a boundary between two teams
and make it hold. The practices are domain independent: a versioned contract, reproducibility as a
test, an enforced import boundary, and published results that gate themselves.

### References

- **Hidden Technical Debt in Machine Learning Systems.**
  D. Sculley et al. NeurIPS 2015.
  *Names the failure mode this project is built against: entanglement and undeclared consumers
  across machine learning subsystem boundaries.*
- **Molecular Descriptors for Chemoinformatics.**
  Roberto Todeschini, Viviana Consonni. Wiley, 2009.
  *The standard reference on the scale and variety of the descriptor space that makes selection a
  combinatorial problem.*
- **Feature Selection: A Data Perspective.**
  Jundong Li et al. ACM Computing Surveys, 2017.
  *Survey of the supervised selection family the knowledge-driven arm is compared against.*
