from itertools import cycle
from math import ceil


def unmangle_disk(data: bytes) -> bytes:
	chunks: list[bytes] = []

	for i in range(ceil(len(data) / 8208)):
		sector = data[i * 8208:(i + 1) * 8208]
		xor = sector[:16]
		sector_data = sector[16:]
		chunks.append(bytes(a ^ b for a, b in zip(sector_data, cycle(xor))))

	return b"".join(chunks)
