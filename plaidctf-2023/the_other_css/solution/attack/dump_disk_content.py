import asyncio
import os
from secrets import token_bytes

from css.cipher import Cipher
from css.io_manager import IOManager, ReaderWriter
from css.mangle import mangle, unmangle
from css.mode import Mode

from ._remote_player import RemotePlayer

ADDRESS = os.environ.get("ADDRESS", None)

async def dump_disk_content(authentication_key: bytes) -> bytes:
	if ADDRESS is not None:
		player = RemotePlayer(ADDRESS, 1996)
	else:
		from css.player import Player
		player = Player("../problem/disks/a.disk")
	host_to_player = IOManager("host -> player", color = "\x1b[31m")
	player_to_host = IOManager("player -> host", color = "\x1b[34m")
	player_task = asyncio.create_task(player.start(ReaderWriter(host_to_player, player_to_host)))

	try:
		host_challenge_key = token_bytes(8)
		host_nonce = token_bytes(8)
		cipher = Cipher(authentication_key, Mode.Authentication)
		encrypted_host_nonce = cipher.encrypt(host_nonce)
		await host_to_player.write(host_challenge_key + encrypted_host_nonce)

		cipher = Cipher(authentication_key, Mode.Authentication)
		host_mangling_key = cipher.encrypt(host_challenge_key)
		response = await player_to_host.read(8)
		cipher = Cipher(authentication_key, Mode.Authentication)
		if cipher.decrypt(unmangle(host_mangling_key, response)) != host_nonce:
			raise Exception("Player-to-Host authentication failed")

		player_challenge = await player_to_host.read(16)
		challenge_key = player_challenge[:8]
		encrypted_player_nonce = player_challenge[8:]
		cipher = Cipher(authentication_key, Mode.Authentication)
		player_mangling_key = cipher.encrypt(challenge_key)
		response = mangle(player_mangling_key, encrypted_player_nonce)
		await host_to_player.write(response)

		cipher = Cipher(authentication_key, Mode.Authentication)
		player_nonce = cipher.decrypt(encrypted_player_nonce)

		mangling_key = bytes(a ^ b for a, b in zip(host_mangling_key, player_mangling_key))
		session_nonce = bytes(a ^ b for a, b in zip(host_nonce, player_nonce))
		session_key = mangle(mangling_key, session_nonce)
		stream_cipher = Cipher(session_key, Mode.Data)

		encrypted_data_start = await player_to_host.read(32)
		if len(encrypted_data_start) == 0:
			raise Exception("Host-to-Player authentication failed")
		first_bytes = stream_cipher.decrypt(encrypted_data_start)
		out = bytes(a ^ b for a, b in zip(first_bytes[:16], first_bytes[16:]))

		encrypted_data = await player_to_host.read_eof()
		print("received", len(encrypted_data), "bytes of encrypted data")
		remaining_bytes = stream_cipher.decrypt(encrypted_data)
		return first_bytes + remaining_bytes
	finally:
		player_task.cancel()
