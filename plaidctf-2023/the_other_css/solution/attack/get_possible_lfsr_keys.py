import os.path
import subprocess
import sys

from css.cipher import _should_invert_1, _should_invert_2
from css.mode import Mode


def get_possible_lfsr_keys(
	output: list[int],
	mode: Mode
) -> list[list[int]]:
	results = subprocess.run(
		[
			os.path.join(os.path.dirname(__file__), "lfsr_bruter/target/release/lfsr_bruter"),
			"--parallel",
			"--num-bits-a",
			"25",
			"--num-bits-b",
			"41",
			"--taps-a",
			str(0x19e4001),
			"--taps-b",
			str(0xfdc0000001),
			*(["--inverted-a"] if _should_invert_1(mode) else []),
			*(["--inverted-b"] if _should_invert_2(mode) else []),
			"--",
			*map(str, output[:10])
		],
		stdout = subprocess.PIPE,
		stderr = sys.stderr.buffer
	)

	results = results.stdout.decode("utf-8").strip()
	assert results.startswith("sat")

	ret: list[list[int]] = []

	for line in results.splitlines()[1:]:
		lfsr1_str, lfsr2_str = line.split(" ")
		lfsr1 = int(lfsr1_str)
		lfsr2 = int(lfsr2_str)

		if (lfsr1 >> 3) & 1 != 1 or (lfsr2 >> 3) & 1 != 1:
			continue

		key1 = (lfsr1 & 0x1fffff0) >> 1 | (lfsr1 & 7)
		key2 = (lfsr2 & 0x1fffffffff0) >> 1 | (lfsr2 & 7)
		key = (key1 << 40) | key2
		ret.append(list(key.to_bytes(8, "big")))

	return ret
