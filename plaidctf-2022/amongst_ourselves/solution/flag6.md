## Insights

Here are the key insights needed to solve the problem, roughly in the order that they are required:

1. The collision check with walls is a little bit strange, which has a couple of different impacts.  Since the player's collision shape is an ellipse, the game first scales everything to treat the player's collision area as a circle, and then does collision checks with that circle.  This basically means that horizontal walls are thinner than vertical ones.  Additionally, there is a bug in the collision check that prevents the game from recognizing intersections if the center of the ellipse is beyond the bounds of the wall along its axis.

2. The way that the collision checks are applied is that the game iterates over the set of possibly-colliding walls, and for each one that is actually colliding with the player, the game pushes the player out of the wall.  Combined with the bug in the wall checks, this gives a method of getting outside of a pair of walls that share an endpoint: if the player can move inside wall A far enough that the center of their collision is outside of the bounds of wall B, and the game checks wall B before wall A, then wall B won't be applied to the player's position on that frame.  Repeated across many frames, this can let the player walk through wall B.  (There's also a second bug here in that being pushed by a wall could add a new wall to the set of possibly-colliding walls, but I couldn't find a way to use that to get out of bounds for this particular map.)

3. The player's maximum speed is 0.5 units, but the server accepts anything within an additional 1e-9 units to account for floating point errors.  Since the player's collision height is 1 unit, this means that the player is able to move fast enough to use the technique outlined in insight 2, though only if wall A is horizontal.

4. This technique won't let you get the flag (there are some specifically-placed out of bounds walls that prevent it), but will let you get out-of-bounds in some places on the Shelld, as well as on the Dropship.

5. When a hoaxer kills a player, they immediately jump to the target position, which can be as many as 6 ticks old.  Wall checks are not applied after the position is updated.  Along with observation 3, this gives another method of getting out of bounds: if you kill someone at a target position within 1e-9 of a horizontal wall, then you can step all the way through that wall on the next tick before collision is applied.

6. The list of available target locations for a particular player is only updated when they are attached to the movement system; if they are attached to any other system the list does not update.  Also, the list is not cleared when loading into a new map.

7. It is possible for some players to attach to a system immediately when loading into The Shelld: the emergency button's hit area is within the spawn range of all players that spawn in any of the center three positions.

8. There is one horizontal wall in The Shelld for which the technique outlined in insight 5 would let you get the flag: the top wall of the hallway between Cafeteria and Admin.

9. Although the wall in insight 8 is not within bounds on the Dropship, you can get to it by going out of bounds, and we have already identified a way to do so!

## Attack

So, putting all of this together, an attacker needs to do the following:

1. Create a new game with three players, Red, Blue, and Green.  Use the technique from insight 2 to clip Red and Blue out of the bottom right corner, then stand in a position that is within 1e-9 of the wall identified in insight 8.  (For example, I used the position `(27.5, 9.000000000001)`.)

2. Use Green to start the game.

3. Upon loading into the game, immediately attach to the emergency button with Red and Blue.

4. There must be one player currently attached to the button who isn't the hoaxer.  Detach the hoaxer from the button if they're currently using it, and move them near the position you're going to clip through the wall.

5. Have the hoaxer kill a non-hoaxer who is currently attached to the button using the target location that Red and Blue were standing at in step 1 while continuously walking upward at maximum speed.

If done correctly, after step 5, the hoaxer will clip through the wall.  At this point they can walk into the hidden room and interact with the conspiracy board to get the flag.

Note that steps 1, 3, and 5 all can't be done using the default client.  An attacker must either modify the client (this is what I did) or set up a websocket server to sit in front of the game server to send requests on their behalf.

My setup is available on the `bp-amongst-ourselves-debug` branch, though it isn't a plug-and-play solution; you have to manually operate it in order to get a flag.