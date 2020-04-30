# That's a Lot of Fish

## Story

The hot sun relentlessly beats down on you as you stagger across the scorching sands of the desert. You've been walking for hours and the endless flat landscape hasn't helped the dizzying feeling you've felt from dehydration, but you had to keep moving.

After escaping the sand prison, you opened up the map on your HUD to see where you were. Except there was no map. You were facing a blank screen. For some reason, even escaping the sand prison hasn’t helped with your HUD at all.

"This is fine. Everything is fine. I'm just gonna teleport back home then."

The dehydration is getting to you, and you’re talking to yourself. It’s a little hard with your tongue so swollen. You go back a few menus on the HUD to teleport to home. But nothing happens when you press the button. Starting to panic, you try to exit REFUGE, but that button doesn't work either. Frustrated, you try hitting all of the buttons a few more times, but don't get any feedback. So you pick a direction and start walking.

And then you find out the hard way what happens when you try to teleport about 25 times during a lag spike. You see flashes of a whole bunch of different locations—your home, the carnival, the stegosaurus fountain at the entrance of the plaza, your house _outside_ REFUGE, the HQB library—before your brain finally shuts off completely from sensory overload and you black out.

You hear a siren. Groggily, you lift your head, and find yourself in the middle of a towering city; but it doesn't look like one you've ever seen. It's not nearly nice enough to be one in REFUGE, not nearly dingy enough to be in the real world. Something feels very, very off here. Oh, and your HUD is gone, so that's cool.

After a few moments, you hear a loud BANG! from a few streets over. A military convoy of some sort suddenly appears from one of the nearby cross streets. With no other ideas for how to proceed, you choose to follow.

What you see there is... confusing. There's something that looks like Godzilla attacking a skyscraper, but it seems to be made completely of metal. Mechagodzilla? And the military force you followed here doesn't seem to have a whole lot of weapons. Instead, from the vehicles, you see them unload tons upon tons of fresh fish, amassing them into one giant heap in the middle of the road. Are they trying to distract a mechanical monster with food? That doesn't sound like a great plan to you.

An onlooker beside you that you hadn't noticed up to this point suddenly pipes up. ["That's a lot of fish,"](https://www.youtube.com/watch?v=WZLg1ARnaxE) he states flatly.

He's not _wrong_, you suppose.

As you watch on, for just a moment, you see a corner of a flag sticking out of the pile of fish, before being covered up by some cod and salmon that are added to the top of the pile. Well, it's not like you have a better option, right? You run up to the smelly pile and plunge in your hands, desperately hoping to locate that flag you just saw.

## Problem Details

Here's the pile of fish.  (Link to handout.)

## Solution

I never had to reverse this, so anything I might say about how to go about reversing anything here would be pretty meaningless!  [hgarrereyn's writeup](https://ctf.harrisongreen.me/2020/plaidctf/thats_a_lot_of_fish/) and [cts's writeup](https://blog.perfect.blue/Lot-of-Fish-PlaidCTF-2020) are both excellent, and I definitely recommend checking them out.  Bonus points to hgarrereyn for writing [a Binary Ninja disassembler](https://github.com/hgarrereyn/bn-fish-disassembler) for my silly VM.

You can see the unmangled source (with some comments) in `problem/index.ts`, the mangler in `problem/mangle.ts`, the program that the VM is running in `problem/tsp.fish`, and an assembler in `problem/assemble.ts`.
