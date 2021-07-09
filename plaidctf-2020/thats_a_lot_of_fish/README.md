# That's a Lot of Fish

Author: bluepichu
Category: reversing
Score: 400 points

## Description

What you see is... confusing. There's something that looks like Godzilla attacking a skyscraper, but it seems to be made completely of metal. Mechagodzilla? And the military force you followed here doesn't seem to have a whole lot of weapons. Instead, from the vehicles, you see them unload tons upon tons of fresh fish, amassing them into one giant heap in the middle of the road. Are they trying to distract a mechanical monster with food? That doesn't sound like a great plan to you.

An onlooker beside you that you hadn't noticed up to this point suddenly pipes up. ["That's a lot of fish,"](https://www.youtube.com/watch?v=WZLg1ARnaxE) he states flatly.

He's not _wrong_, you suppose.

As you watch on, for just a moment, you see a corner of a flag sticking out of the pile of fish, before being covered up by some cod and salmon that are added to the top of the pile. Well, it's not like you have a better option, right? You run up to the smelly pile and plunge in your hands, desperately hoping to locate that flag you just saw.

(Part of [a larger story](https://docs.google.com/document/d/15NtrJPTbBXqXce_T1z-7nHMPR2eE109fycaviSTnq30).)

---

Here's the pile of fish.  (Link to handout.)

## Design

Inspired by [this issue on the TypeScript Github](https://github.com/microsoft/TypeScript/issues/14833), I set out to exploit the fact that TypeScript's type system is turing complete to write a little VM for players to reverse.

The design of the problem is, for the most part, pretty straightforward, as I essentially started with the most basic units of computation and work my way all the way up to entire operations.  For example, to get to an addition operation, I started with basic definitions for `Bit`, then built that up into `Num`, then used those alongside a bit addition lookup table to build the individual recursive cases for addition, and finally put it all together to add together two `Num`s.  By simply building up in this fashion it's not too hard to work out implementations for all of the basic arithmetic and bitwise operations, though the patterns you need to use to make TS not try to infinitely unroll your types take some getting used to.  (Fortunately, that original Github thread provides a lot of help in that regard!)

With those in place, it also wasn't too hard to put together a very simple machine; all you need is some kind of addressing system, and then you can break down operations into a series of reads, writes, and arithmetic operations, the latter of which I already had.

At this point I had a basic machine working, but I wanted to do something extra interseting to exploit the fact that we have easy access to nice structures within the type system.  I ultimately settled on implementing a heap as a memory primitive, since it's not too terrible to write (and, just as importantly, reverse) a functional-style leftist heap.

With all of this put together, it became a matter of determining how to encode a flag.  I thought for a long time about what a reasonable way to do this would be, and ultimately settled on having the VM verify a solution to a small hardcoded instance of TSP.  This seemed to me like a good program for it to run as it would utilize the heap primitive well and would be brute forceable once the competitor understood what the VM is doing.  Once I had a solution with a unique correct solution generated, all that was left was to ensure that the flag couldn't be brute forced, which was easily accomplished by adding in a large amount of hashing to the final flag computation.

## Solution

You can see the unmangled source (with some comments) in `problem/index.ts`, the mangler in `problem/mangle.ts`, the program that the VM is running in `problem/tsp.fish`, and an assembler in `problem/assemble.ts`.

I've included a Dockerfile with all of the types cut out that executes on the correct input to produce the flag in the `solution` directory.

## Deployment

This problem has no server.  Simply provide the contents of the `handout` directory to competitors.
