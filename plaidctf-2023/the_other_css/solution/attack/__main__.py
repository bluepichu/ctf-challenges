from math import ceil

from css.cipher import Cipher
from css.mangle import mangle
from css.mode import Mode

from ._cache import async_cache, cache
from .attack_disk_key import attack_disk_key
from .dump_disk_content import dump_disk_content
from .get_possible_lfsr_keys import get_possible_lfsr_keys
from .leak_auth_lfsr import leak_auth_lfsr
from .unmangle_disk import unmangle_disk

bad_auth_keys = []

async def main():
	auth_lfsr = await phase_1()
	print("auth_lfsr =", auth_lfsr)

	auth_key, disk_plaintext = await phase_2(auth_lfsr)
	print("auth_key =", auth_key)
	print("disk_plaintext[:24] =", disk_plaintext[:24])

	with open("a.out.mp4", "wb") as f:
		f.write(unmangle_disk(disk_plaintext))

	with open("../problem/disks/a.disk", "rb") as f:
		disk_ciphertext = f.read()

	disk_key = phase_3(disk_plaintext, disk_ciphertext)
	print("disk_key =", disk_key)

	with open("../problem/disks/b.disk", "rb") as f:
		flag_ciphertext = f.read()

	player_key_id, player_key = phase_4(disk_ciphertext, disk_key, flag_ciphertext)
	print("player_key_id =", player_key_id)
	print("player_key =", player_key)

	flag_key_ciphertext = flag_ciphertext[8 * player_key_id:8 * player_key_id + 8]
	cipher = Cipher(player_key, Mode.DiskKey)
	flag_key = cipher.decrypt(flag_key_ciphertext)
	print("flag_key =", flag_key)

	flag_sector_plaintexts: list[bytes] = []

	flag_ciphertext = flag_ciphertext[8 * 128:]
	for i in range(ceil(len(flag_ciphertext) / 8216)):
		print("decrypting sector", i)
		sector = flag_ciphertext[8216 * i:8216 * i + 8216]
		sector_nonce = sector[:8]
		sector_key = mangle(flag_key, sector_nonce)
		cipher = Cipher(sector_key, Mode.Data)
		flag_sector_plaintexts.append(cipher.decrypt(sector[8:]))

	flag_plaintext = b"".join(flag_sector_plaintexts)

	with open("b.out.mp4", "wb") as f:
		f.write(unmangle_disk(flag_plaintext))

@async_cache("phase_1.pkl")
async def phase_1():
	return await leak_auth_lfsr()

@async_cache("phase_2.pkl")
async def phase_2(auth_lfsr: list[int]):
	possible_auth_keys = get_possible_lfsr_keys(auth_lfsr, Mode.Authentication)
	print("possible_auth_keys =", possible_auth_keys)
	for auth_key in possible_auth_keys:
		if auth_key in bad_auth_keys:
			continue
		print("Trying", bytes(auth_key))
		try:
			disk_plaintext = await dump_disk_content(bytes(auth_key))
			print(f"Continuing with auth key {bytes(auth_key)} -- if it doesn't work, add it to bad_auth_keys and try again")
			return auth_key, disk_plaintext
		except Exception as e:
			pass

	raise Exception("No valid auth key found")

@cache("phase_3.pkl")
def phase_3(disk_plaintext: bytes, disk_ciphertext: bytes):
	return attack_disk_key(disk_ciphertext, disk_plaintext)

@cache("phase_4.pkl")
def phase_4(disk_ciphertext: bytes, disk_key: bytes, flag_ciphertext: bytes):
	for i in range(128):
		disk_key_ciphertext = disk_ciphertext[8 * i:8 * i + 8]
		lfsr_output = [disk_key_ciphertext[j] ^ disk_key[j] for j in range(8)]
		valid_keys: list[bytes] = []

		for player_key in get_possible_lfsr_keys(lfsr_output, Mode.DiskKey):
			valid_keys.append(bytes(player_key))

		if len(valid_keys) == 1:
			return (i, valid_keys[0])

	raise Exception("No player key found")

if __name__ == "__main__":
	import asyncio
	asyncio.run(main())
