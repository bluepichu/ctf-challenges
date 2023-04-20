# Solution

The critical bug is poor handling of transaction closure on TypeORM's part.  In particular, this part of `executeTurn.ts` is problematic:

```ts
moveOutcomes = await dataSource.transaction(async (tx) => {
	const ships = await tx.findBy(Ship, { factionId, sunk: false });
	const shipsMap = Map(ships.map((ship) => [ship.id, ship]));
	const shipsWithMoves = shipsMap.map((ship): [Ship, Move] => [ship, moves.get(ship.id) ?? {}]);
	return await asyncBindMap(shipsWithMoves, async ([ship, move]) => (
		executeMove(tx, ship, move)
	));
});
```

Internally, `asyncBindMap` is using `Promise.all` to wait for all of the promises to resolve.  This leads to an issue if one of those promises fails.  The intended behavior is that the transaction should be rolled back.  While TypeORM does do this, the particular method through which it does this is to await a `ROLLBACK` command, and then release the connection back to the pool.  However, there is no check preventing the connection from being used again in between when the `ROLLBACK` is sent and when the connection is actually released.  In practice, this means that one command from each of the `executeMove` calls will be executed _outside of the transaction_.  If it's a `SELECT`, then this is fine, but if it's a `UPDATE` or `INSERT`, then this will cause the database to be in an inconsistent state.

In the game, there are two ways that this can be used to cheat:

1. Deal damage to an enemy ship by shooting at it, but only commit the damage being dealt and not the loss of the cannonball.  If you're tricky about it, you can also use this to maintain a position outside of the firing range of the enemy.

2. Score buoys twice in a single turn by having the one command outside the transaction be the one that adds the score for the turn.  A clever arrangement can actually use this to score more than double the intended amount by carefully manuevering such that some buoys score bonus on the intended action (by moving from out-of-range to in-range) and some score on the empty action run after the error (by starting in-range).

Actually carrying out this attack is made difficult in practice because it requires understanding and careful manipulation of the event loop in order to ensure that the proper commands are executed outside of the transaction.