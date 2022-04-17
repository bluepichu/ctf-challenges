# Amongst Ourselves&emsp;<sub><sup>Pwn/Rev/Crypto/Web/Misc, 950 points total</sup></sub>

_Special thanks to strikeskids for testing this problem._

Note that this problem was split into two different problem listings in the problem dashboard, "Shipmate" and "Hoaxer".

## Problem Description

### Amongst Ourselves: Shipmate

PPP is proud to announce a completely original, platform-exclusive game for Plaidiverse! With novel socially deceptive mechanics, Amongst Ourselves™ has been recognized with the "Best-In-Class"® and "Best Narrative Game"® awards at the 2022 Plaidies℗℗℗ Game Awards™. Available now at e-shops near you in the Plaidiverse!!

**Upload Data (70 points).** When Blue's body is found in the communications room, Brown thinks the file she was processing may contain a hint about who killed her. (Misc. Hint: take a look at FileTransferController.ts.)

**Process Sample (70 points).** After Orange is found dead in the cafeteria, Brown and Cyan investigate soil samples to determine a cause of death. (Crypto.)

**Provide Credentials (70 points).** Green starts teleporting wildly around The Shelld before suddenly disappearing. Meanwhile, Brown inspects the access logs on the ship's computer to piece together a timeline of the murders. (Web.)

**Recalibrate Engine (70 points).** After the ship experiences some engine trouble, the crew turns on Pink and White and accuses them of the killings. Curiously, Green also reappears briefly, before vanishing again. (Rev.)

**Purchase Snack (70 points).** In a moment of calm, the shipmates reminisce over a meal of potato chips and chocolate chip cookies about their lives on Earth and share the reasons they joined the mission in the first place. (Pwn. Hint: take a look at PurchaseSnackPanel.tsx.)

## Amongst Ourselves: Hoaxer

PPP is proud to announce DLC for the Critically Acclaimed™ video game Amongst Ourselves™, only on Plaidiverse! Find out the true identity of the murderer, and explore never-before-seen areas of The Shelld and beyond! ...After you give us another $40, that is. (Note: handout and servers are identical to Amongst Ourselves: Shipmate.)

**Contact Satellite (250 points).** With only five shipmates left, Brown and Cyan scramble to retrieve critical data from a nearby satellite.

**Incite Conspiracy (250 points).** After the tragic loss of Cyan, the remaining shipmates find out that Brown has been hiding in a secret room of The Shelld, and accuse him of being the hoaxer. (Series finale!)

**Explore Environment (100 points).** Free with the Hoaxer DLC: an interactive commentary from the creators of Amongst Ourselves on the design of the game and its captivating plot. (You receive this flag if you complete either Contact Satellite or Incite Conspiracy.)

## Deployment

Almost all of the code is part of the handout; to get a copy of what the competitors had, run `make handout`.  **Note that the pcap generator is nondeterministic, and I specifically chose a pcap that could be used to reconstruct enough of the image to clearly read the flag for the actual deployment.**

## Solution

TODO: make a writeup

You can see my solution scripts for the Shipmate challenges in the `solution` directory.  I don't have scripts for the Hoaxer challenges since it was relatively easy to live-modify the client code to solve them.
