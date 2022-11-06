# Toaster Wars: Going Rogue, Episode 2.5 &mdash; 20000 Leagues Under the Sink&emsp;<sub><sup>Web, 975 points total</sup></sub>

## Problem Description

I'd heard of the weird region-specific edition of TW:GR, but I didn't know they were planning on bringing it to the masses. And as a neat online game, no less! They just put out a [public beta](http://toasterwars.pwni.ng/).

**Part I, Light Flag (225 points).** I found a locked box in Undersea Cavern once... and I think I saw a key in Calm Crystal Reef somewhere? Can you break the lock?

**Part II, Blazing Flag (300 points).** Based on the site, there's a dungeon called Shallow Sand Bar that's only open to players from their closed alpha. Surely that won't stop you from getting the flag at the end of that dungeon.

**Part III, Stormy Flag (450 points).** The boss at the end of Treacherous Trench, the Golden Spatula, is a jerk. Show him what you're made of and grab the flag!

## Deployment

The problem handout was everything in the `problem` directory; however, some edits were made to make the problem easier to deploy than it was in its original form:

- Docker-related files were added for proper containerization
- Some changes were made to redis-related connection arguments to support running the redis server in a separate container
- Some changes were made to allow the monitor service to be accessed externally (note that players did not have access to this service)
- The code now automatically sets up a user `bluepichu` with the password `iliketoast`; this was not present in the original, and the users that existed in the DB were set up manually.  Players would not have had access to any user credentials (or their hashes).

There was also an XSS bot that was relevant to the Blazing Flag, which would occasionally connect and log in as one of several users before disconnecting.  I don't have the source for that anymore, but you should be able to accomplish the same thing by logging in manually.

## Solution

- [Light Flag](https://dttw.tech/posts/HJT_TjhN8)
- [Blazing Flag](https://dttw.tech/posts/rySbsZR4L)
- Stormy Flag (TODO)
