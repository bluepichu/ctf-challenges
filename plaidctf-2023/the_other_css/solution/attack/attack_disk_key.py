from collections import defaultdict
from dataclasses import dataclass
from math import ceil

from css.cipher import Cipher
from css.mangle import mangle
from css.mode import Mode
from css.table import table

from .get_possible_lfsr_keys import get_possible_lfsr_keys


@dataclass
class SectorInfo:
	index: int
	nonce: bytes
	plaintext: bytes
	ciphertext: bytes

def attack_disk_key(
	disk_ct: bytes,
	disk_pt: bytes
) -> bytes:
	disk_offset = 8 * 128
	sectors: list[SectorInfo] = []

	for i in range(ceil(len(disk_pt) / 8208)):
		plaintext = disk_pt[i * 8208 : (i + 1) * 8208]
		ciphertext_sector = disk_ct[disk_offset + i * 8216 : disk_offset + (i + 1) * 8216]
		nonce = ciphertext_sector[:8]
		ciphertext = ciphertext_sector[8:]
		sectors.append(SectorInfo(i, nonce, plaintext, ciphertext))

	opt1_possibilities = recover_disk_key_bytes(
		sectors,
		[
			(7, ({ 1, 2, 3, 4 }, { 2, 3, 4, 5 }))
		],
		({ 4, 5, 6, 7 }, { 3, 4, 5, 6 })
	)
	opt2_possibilities = recover_disk_key_bytes(
		sectors,
		[
			(7, ({ 4, 5, 6, 7 }, { 3, 4, 5, 6 })),
			(5, ({ 0, 1, 2, 3 }, { 0, 1, 2, 6, 7 }))
		],
		({ 1, 2, 3, 4 }, { 2, 3, 4, 5 })
	)

	sector = sectors[0]

	for opt1 in opt1_possibilities:
		k567, k456, k7 = opt1
		for opt2 in opt2_possibilities:
			k234, k345, k5 = opt2
			k6 = k567 ^ k5 ^ k7
			k4 = k456 ^ k5 ^ k6
			k3 = k345 ^ k4 ^ k5
			k2 = k234 ^ k3 ^ k4
			for i in range(256):
				for j in range(256):
					disk_key = bytes([i, j, k2, k3, k4, k5, k6, k7])
					sector_key = mangle(disk_key, sector.nonce)
					cipher = Cipher(sector_key, Mode.Data)
					if cipher.decrypt(sector.ciphertext[:16]) == sector.plaintext[:16]:
						return disk_key

	raise Exception("Unable to solve for disk key")

def recover_disk_key_bytes(
	sectors: list[SectorInfo],
	options: list[tuple[int, tuple[set[int], set[int]]]],
	tests: tuple[set[int], set[int]]
) -> set[tuple[int, int, int]]:
	meta_possible = None

	for index, (check1, check2) in options:
		groups: defaultdict[tuple[int, int], list[SectorInfo]] = defaultdict(lambda: [])

		for sector in sectors:
			key1 = xor_indices(sector.nonce, check1)
			key2 = xor_indices(sector.nonce, check2)
			groups[(key1, key2)].append(sector)

		for group in groups.values():
			if len(group) < 2:
				continue

			a_sector = group[0]

			print("Solving sector", a_sector.index)
			a_lfsr_keys = get_possible_lfsr_keys(
				list(bytes_xor(a_sector.ciphertext[:16], a_sector.plaintext[:16])),
				Mode.Data
			)

			assert len(a_lfsr_keys) == 1
			a_lfsr_key = a_lfsr_keys[0]

			ax = xor_indices(group[0].nonce, tests[0])
			ay = xor_indices(group[1].nonce, tests[0])

			for b_sector in group[1:]:
				possible: set[tuple[int, int, int]] = set()

				print("Solving sector", b_sector.index)
				b_lfsr_key = get_possible_lfsr_keys(
					list(bytes_xor(b_sector.ciphertext[:16], b_sector.plaintext[:16])),
					Mode.Data
				)

				assert len(b_lfsr_key) == 1
				b_lfsr_key = b_lfsr_key[0]

				bx = xor_indices(group[0].nonce, tests[1])
				by = xor_indices(group[1].nonce, tests[1])

				for i in range(256):
					lx = table[i ^ ax]
					ly = table[i ^ ay]
					for j in range(256):
						rx = table[j ^ bx]
						ry = table[j ^ by]
						for k in range(256):
							x = table[lx ^ rx ^ k]
							y = table[ly ^ ry ^ k]
							if x ^ y == a_lfsr_key[index] ^ b_lfsr_key[index]:
								possible.add((i, j, k))

				if meta_possible is None:
					meta_possible = possible
				else:
					meta_possible &= possible

				print("Remaining possibilities:", len(meta_possible))

				if len(meta_possible) <= 1:
					break

			if meta_possible is not None and len(meta_possible) <= 1:
				break

		if meta_possible is not None and len(meta_possible) <= 1:
			break

	return meta_possible

def xor_indices(data: bytes, indices: set[int]) -> int:
	result = 0
	for i in indices:
		result ^= data[i]
	return result

def bytes_xor(a: bytes, b: bytes) -> bytes:
	return bytes([x ^ y for x, y in zip(a, b)])
