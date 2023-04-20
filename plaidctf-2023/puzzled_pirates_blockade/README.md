# Puzzled Pirates: Blockade!&emsp;<sub><sup>Web, 600 points</sup></sub>

_Special thanks to zwad3 for testing this problem._

## Problem Description

Officers, here's the situation! We be in a blockade, vyin' for control of Admiral Island! If we win, we gain control of vast riches beyond our wildest dreams! However, me quartermaster be sayin' this be not possible — he be sayin' that "the blockade started thirty minutes ago" and "we don't have enough cannonballs" and that it be "numerically impossible for us to make up the point deficit in the allotted time." But today we prove him wrong! We may be outgunned and outshipped, but we will take this island! Who's with me!?

**The Battle for Admiral Island! (600 points).** This island will be ours!

## Deployment

Run `make` in the problem directory to generate the handout.  Launching is handled with slingshot.

## Solution

TODO: better writeup

This is based on [this TypeORM issue](https://github.com/typeorm/typeorm/issues/9964) (created after the CTF ended).  Optimizing for points requires careful analysis of how Node's event loop works (or tons of trial and error).  See the `solution` directory for my solution, as well as some images documenting the ship movement that the script uses.
