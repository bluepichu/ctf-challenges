# Back to the Future

## Story

When the hunt for the flags first started, competitors flocked to the newly-opened Bovik Museum in the Inner Sanctum. After all, to understand his challenges, one must understand the man himself, right? Pretty much anyone looking to score one of the flags has spent many a long night reviewing the many exhibits on his life. Now, though, after seeing what’s happening to the world he created, you don’t feel overjoyed to be back there. Really, you’re looking for anything that could help you get REFUGE back to the way it once was, before the prize was announced. You turn to your buddy, and you both agree that it’s time for a bit of wandering to clear your heads. All the craziness is a lot to take in.

You find yourself in a wing with some fairly ancient technology. You recognize this as replica hardware for what Bovik had back in the early-to-mid 1990's. You've been to this exhibit before, back when the museum first opened, but you haven't been back since. The room shakes with one of the jitters you’ve been getting accustomed to, knocking Bonzi into you, and pushing you into a stack of networking hardware set up on a desk beside an old IBM PC. A modem from the top of the stack clatters to the floor.

After picking up the fallen modem, you turn back to the stack of hardware to return it when something strange about the modem itself catches the corner of your eye. It looks like the bottom of the modem has some nonstandard hardware for networking in the 1990's. There are three (are those fuses?) arranged in a triangular pattern, radiating from a node in the center of the modem, before each connecting to some components back inside the plastic shell near the edges. You can't imagine what the function of those could possibly be, but your interest is piqued. Getting a weird sense of deja vu, you decide to investigate further.

You suddenly realize why the arrangement of fuses on the bottom of the modem feels familiar; they aren't fuses at all, they're a Flux Capacitor like the one from Back to the Future! So if it's attached to a modem, then... it's sending data through time? But surely this hardware couldn't actually send packets to the past, right?!

It’s the one last hope that you’ve been looking for. Maybe you can get a message into the past to warn everyone about the situation. You don’t know how to really control this thing, so you’ll just have to do your best. Even the things you love most don’t last; your best is really all you can do.

## Problem Description

Access your modem here.  (Links to handout and submission site.)

Note: there are requirements for the URL you submit. Please see the source of the submission site for more details.

Hint: The bot is running the binary in an ubuntu:18.04 container and has a 30-second timeout.

## Solution

There are _many_ solutions.  You can find mine in the `solution` directory; it exploits a very faulty `sprintf` in the NNTP handler.

TODO full writeup
