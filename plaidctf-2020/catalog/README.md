# Catalog&emsp;<sub><sup>Web, 500 points</sup></sub>

## Story

> Having thoroughly explored the anime section of the HQB Multimedia Library, you decide to venture on into the other sections. Next on your list is a section of comic books.
>
> You've flipped through a few of the issues available, but they all seem like the standard fare. (Even if there's some really rare stuff in here—not that you'd expect _Action Comics No. 1_ or _Detective Comics No. 27_ to be worth all that much in virtual form.) As you look around, one empty space on the shelf catches your attention. There's an open spot for a series called Plaid Comics, which also appears to only have a single issue. Interesting.
>
> Fortunately, the library has [a catalog website](http://catalog.pwni.ng/), so you can look up the missing volume! The site's a bit strange; it seems like it's something of a community effort, and allows you to add your own descriptions for issues if they're missing. However, descriptions aren't public until an admin approves, and while you were able to find the [issue in question](http://catalog.pwni.ng/issue.php?id=3), it appears that the description isn't public. But if an admin can see it, that's just as good as if you could see it, right?

## Problem Description

[Here’s the site](http://catalog.pwni.ng/). The flag is on [this page](http://catalog.pwni.ng/issue.php?id=3).

Browser: Chromium **with uBlock Origin 1.26.0 installed and in its default configuration**

Flag format: `/^PCTF\{[A-Z0-9_]+\}$/`

Hints:

- To view your post, the admin will click on a link on the admin page.
- You might want to read up on User Activation.
- The intended solution does not require you to submit hundreds of captchas.
- The admin bot will always disconnect after about 30 seconds.

## Solution

The full solution script is in `solution/04_final`; a full writeup for this problem is available [here](https://dttw.tech/posts/B19RXWzYL).
