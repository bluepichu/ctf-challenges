# The Other CSS&emsp;<sub><sup>Crypto, 200 + 250 points</sup></sub>

_Special thanks to f0xtr0t for his help in putting together this problem and to ubuntor for testing it._

## Problem Description

Long ago, I found a chest with some most curious booty: two pristine shiny disks, and a piece of parchment promisin’ me wealth and riches if I could reveal their secrets. Now, many years later, I’ve finally found a machine capable o’ gettin’ their data -- but the scupperin’ thing jammed with one o’ me disks inside! Worse yet, the machine only be half o’ what I need: it acts as a “player” and needs some other device to act as “host” to communicate with it! Can ye help me out, bucko? (Note: PPP does not condone media piracy)

**Disk A (200 points).** The CSS_AUTHENTICATION_KEY, CSS_PLAYER_KEY_ID, and CSS_PLAYER_KEY_DATA are not given, nor is the keys file used when making the two disks. If you want to test locally, make your own disks and set your own keys. CSS_AUTHENTICATION_KEY is fixed and will not change. The flag is case insensitive.

**Disk B (250 points).** If your flag gets rejected, try adding an underscore between the first and second parts of the flag.

## Errors

- The flag for disk A was changed last minute because it was too hard to read in the font used in the video.  However, it still existed as a string in the metadata of the file.  Apologies to the teams that lost time trying to figure this out.
- The flag for disk B was missing an underscore.  This was noted in the problem description once it was reported.
- The `pyproject.toml` specified `z3-solver` as a dependency despite it not being used anywhere, suggesting that it would likely be part of the solution.  My final solution didn't actually use it at all, but apparently it served as a hint to some teams.  Though it obviously would've been better to remove this before release, I don't think it impacted the difficulty of the problem at all.

## Deployment

Run `make` in the problem directory to generate the handout.  To run the problem, build the containers and run `docker compose up`.

## Solution

TODO: an actual writeup

See `solution` directory.  Special thanks to f0xtr0t for writing the LFSR bruter implementation.
