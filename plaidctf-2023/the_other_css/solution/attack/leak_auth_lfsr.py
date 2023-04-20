import asyncio
import os
from typing import Optional

from css.io_manager import IOManager, ReaderWriter
from css.mangle import mangle
from css.table import table

from ._remote_player import RemotePlayer

ADDRESS = os.environ.get("ADDRESS", None)

query_cache: dict[bytes, bytes] = {}

async def query_bytes(value: bytes) -> bytes:
	if ADDRESS is not None:
		player = RemotePlayer(ADDRESS, 1996)
	else:
		from css.player import Player
		player = Player("../problem/disks/a.disk")
	host_to_player = IOManager("host -> player", color = "\x1b[31m")
	player_to_host = IOManager("player -> host", color = "\x1b[34m")
	player_task = asyncio.create_task(player.start(ReaderWriter(host_to_player, player_to_host)))
	await host_to_player.write(bytes([0] * 8) + value)
	result = await player_to_host.read(8)
	player_task.cancel()
	return result

async def query(value: list[int]) -> list[int]:
	global query_cache
	bytes_value = bytes(value)
	if bytes_value in query_cache:
		return list(query_cache[bytes_value])
	result = await query_bytes(bytes_value)
	query_cache[bytes_value] = result
	return list(result)

async def leak_byte(y: int, ptl: int, ptr: int) -> int:
	possible: Optional[list[tuple[int, int, int]]] = None

	target = (await query([0] * 8))[y]

	base = [
		(target ^ table[x2 ^ table[x3]], x2, x3)
		for x2 in range(256)
		for x3 in range(256)
	]

	possible = list(base)

	for i in range(1, 256):
		pt = [0] * 8
		pt[ptl] = i
		value = (await query(pt))[y]
		possible = [
			(x1, x2, x3)
			for x1, x2, x3 in possible
			if x1 == value ^ table[x2 ^ table[i ^ x3]]
		]
		print(i, len(possible))

		if len(possible) == 1:
			break

	if len(possible) > 1:
		print(f"warning: {len(possible)} possible values for l with y = {y}")
	l = possible[0]

	possible = list(base)

	for i in range(1, 256):
		pt = [0] * 8
		pt[ptr] = i
		value = (await query(pt))[y]
		possible = [
			(x1, x2, x3)
			for x1, x2, x3 in possible
			if x1 == value ^ table[x2 ^ table[i ^ x3]]
		]

		if len(possible) == 1:
			break

	if len(possible) > 1:
		print(f"warning: {len(possible)} possible values for r with y = {y}")
	r = possible[0]

	return target ^ l[0] ^ r[0]

def list_mangle(key: list[int], value: list[int]) -> list[int]:
	return list(mangle(bytes(key), bytes(value)))

async def leak_auth_lfsr() -> list[int]:
	k6 = await leak_byte(7, 7, 1)
	k5 = await leak_byte(6, 6, 0)
	k4 = await leak_byte(5, 5, 7)
	k3 = await leak_byte(4, 4, 5)
	k2 = await leak_byte(3, 3, 4)
	k7 = await leak_byte(0, 0, 2)

	server_result = await query([0] * 8)

	for k0 in range(256):
		for k1 in range(256):
			if list_mangle([k0, k1, k2, k3, k4, k5, k6, k7], [0, 0, 0, 0, 0, 0, 0, 0]) == server_result:
				return [k0, k1, k2, k3, k4, k5, k6, k7]

	raise Exception("no key found")
