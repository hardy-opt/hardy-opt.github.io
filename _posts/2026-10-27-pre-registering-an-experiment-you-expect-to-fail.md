---
layout: post
title: Pre-registering an experiment you expect to fail
date: 2026-10-27 09:00:00+0900
description: Four practices that changed how much I trust my own results, and the one that catches the error no amount of care prevents.
tags: research-methods
categories: research-methods
giscus_comments: false
related_posts: true
---

Most things you try do not work. This is not a complaint about research; it is the base rate. If
you test ten ideas and two pay off, you are doing well.

The uncomfortable corollary is that **your methodology has to be good enough to tell the two from
the eight**, and the default way of working is not. Not because anyone is dishonest, but because
the ordinary sequence of events quietly rewards the wrong answer:

1. Try something.
2. Look at the numbers.
3. Decide what the comparison was.

Step 3 is where it goes wrong. Once you have seen the data there are a dozen defensible ways to
slice it, and you will (in complete good faith) pick one that happens to favour what you just
built. Nobody has to cheat for this to happen. It is just what happens when the analysis is chosen
after the result.

Here are four practices that, over the last couple of years, have changed how much I trust my own
conclusions. None is original. All of them are cheap. I now find work that does not use them hard
to read.

## 1. Write the design down before you run it

Before the run: what is being compared, on what data, with what metric, how many seeds, and
**what result would count as the method not working**. Commit that to the repository. Do not edit it
afterwards.

The first time I did this properly, the pre-registration said in advance that if the effect did not
appear on a held-out external set, the method had not worked. The effect did not appear on the
external set. Because that sentence was already written down and committed, there was no
conversation about whether external validation was really the right test: the question had been
settled while I still had no idea what the answer would be.

That is the whole mechanism. You are not proving your integrity to anyone. You are **removing your
future self's ability to rationalise**, at a moment when you are the only person who could catch it.

The strange part is how often the pre-registration improves the experiment. Writing "what would
falsify this?" before running it tends to reveal that your planned comparison would not have
answered the question at all.

## 2. Compare pairs, not percentages

"Method A scores 0.72, method B scores 0.77" is almost no information. How many items? How much do
they vary? Did B win on the same items A won, or different ones?

Run both on the **same items** and compare the paired outcomes. For binary results, solved or
unsolved, correct or incorrect, McNemar's test asks the only question that matters: among items
where the two methods disagreed, how lopsided was the disagreement? Eight wins and zero losses means
something. Forty wins and thirty-two losses is the same aggregate difference and means almost
nothing.

For continuous outcomes, bootstrap a confidence interval. It takes four lines and it converts "B is
better" into "B is better by somewhere between this and that", which is a claim someone can actually
act on.

## 3. State the detection floor

This is the one I would most like to see become standard, because it is nearly free and it prevents
a whole category of mistake.

A detection floor is one sentence: *at this sample size and this variance, we cannot resolve a
difference smaller than Δ.* You compute it once, from the spread you already measured.

Why it matters: without it, a small improvement is indistinguishable from noise **and the reader has
no way to tell which they are looking at**. With it, "+0.3% on 20 seeds, floor 0.9%" reads
immediately as *we found nothing*: which is a real result, honestly reported, and stops you and
everyone after you from building on sand.

I have seen more wasted effort come from un-floored small effects than from any other single
methodological gap.

## 4. Report the negative results, with the mechanism

A write-up that only reports what worked is less useful than one that says: *we tried five things,
four lost, here is why.*

This is partly about other people's time. It is mostly about yours. The negative results are what
tell you where the problem actually is. If four search-side interventions all fail and one succeeds,
that pattern is a much stronger signal about the structure of the problem than the single success is.

And "it did not work" is not the finding. **The mechanism is the finding.** A more sophisticated
method that loses to a simpler one is uninteresting until you can say what it was spending its extra
capability on and why that did not pay. Then it is interesting, and it generalises.

## The practice that catches what care does not

Everything above is still you, checking your own work.

The thing that has caught the most actual errors in my work is having **someone else re-derive the
headline numbers from the raw data, independently**, without reading my analysis code. It finds the
class of mistake that no amount of care prevents, because care operates inside your own assumptions.

The most common thing it finds is not an arithmetic error. It is a **number that has drifted from its
denominator**: a figure that was correct when it was made, quoted later in a context where its
population had changed, and then repeated. Both the figure and the sentence around it look fine. They
just no longer refer to the same set of items.

A cheap mechanical version of this: a script that re-derives every published number from committed
raw data and **reads no analysis file**. Run it in CI. A figure that no longer follows from its data
becomes a build failure rather than something a colleague notices in a meeting six months later.

## The cost

Maybe 10-15% more time per experiment. Against which: the ideas that survive this process are ones
I will defend in a review, and I no longer have the background hum of wondering whether a result I
reported last year was real.

For an individual researcher that is a good trade. For a team, where one wrong number propagates
into everyone else's planning, it is not close.
