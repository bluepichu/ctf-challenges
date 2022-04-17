# Usage: python flag2.py <plaintext> <ciphertext>

# The plaintext here is the "sample id" shown to the first player that has to
# interact with the Process Sample task, and the ciphertext is the "result id"
# shown to the second player.

# This solution depends on the plaintexts forming an invertible matrix; if they
# don't, then plaintexts and ciphertexts from multiple runs can be concatenated
# and this script will try all possible combinations to find a set that produces
# an invertible matrix.

import sys
import numpy as np
from sympy import Matrix
from itertools import combinations

alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_!?"
fwd = { alphabet[i]: i for i in range(len(alphabet)) }
rev = { i: alphabet[i] for i in range(len(alphabet)) }

plaintext = sys.argv[1]
ciphertext = sys.argv[2]

assert len(plaintext) == len(ciphertext)
assert len(plaintext) % 5 == 0

def map_chunk(chunk: str):
	return [fwd[c] for c in chunk]

pt_chunks = [map_chunk(plaintext[i:i+5]) for i in range(0, len(plaintext), 5)]
ct_chunks = [map_chunk(ciphertext[i:i+5]) for i in range(0, len(ciphertext), 5)]
chunks = list(zip(pt_chunks, ct_chunks))

for chunk_opts in combinations(chunks, 5):
	selected_pt_chunks, selected_ct_chunks = zip(*chunk_opts)

	try:
		A = Matrix(selected_pt_chunks)
		A_inv = A.inv_mod(29)

		print("PCTF{", end = "")

		for i in range(5):
			b = Matrix([selected_ct_chunks[j][i] for j in range(5)])
			x = (A_inv * b) % 29

			for j in range(5):
				print(rev[x[j]], end = "")

		print("}")

		break
	except:
		pass
else:
	print("No solution found; try concatenating multiple runs.")
	sys.exit(1)
