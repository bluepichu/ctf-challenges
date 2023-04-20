import struct

import numpy as np
import numpy.typing as npt
import unicorn  # type: ignore
from ortools.graph.python.max_flow import SimpleMaxFlow  # type: ignore
from math import ceil
from itertools import product

from ..poetry import Poem
from ..validation import validate_poem, ValidationException
from .challenge import Challenge, ChallengeException

wellerman = [  # To the tune of "Wellerman" (Nathan Evans)
    ("a", "010010101"),
    ("a", "01001001001"),
    ("b", "01010101"),
    ("c", "0101001"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("e", "1010101"),
    ("e", "01010101"),
    ("e", "01010101"),
    ("c", "010101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("f", "010101010"),
    ("f", "01101010"),
    ("f", "0100101010"),
    ("c", "10101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("g", "01010101"),
    ("g", "01010101"),
    ("g", "010100101"),
    ("c", "010101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("h", "01010101"),
    ("h", "01010101"),
    ("h", "010100101"),
    ("c", "010101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("i", "010010101"),
    ("i", "010100101"),
    ("j", "0100101001"),
    ("j", "0010010101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
    ("d", "1101001"),
    ("d", "010100101"),
    ("d", "11001001"),
    ("c", "010101"),
]

static_tests = [
    np.array([[0, 4], [2, 0]]),
    np.array([[0, 0, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 1, 0, 0]]),
    np.array([[0, 5, 4], [9, 0, 0], [0, 1, 0]]),
    np.array([[0, 3, 19, 17], [0, 0, 0, 0], [0, 3, 0, 0], [4, 0, 0, 0]]),
    np.array(
        [
            [0, 0, 5, 2, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 3, 0],
            [0, 0, 2, 0, 0, 4],
            [0, 2, 0, 0, 0, 1],
            [0, 5, 0, 0, 0, 0],
        ]
    ),
]


class WellermanChallenge(Challenge):
    def get_summary(self) -> str:
        return "Wellerman: I think there was this song we used to sing about someone who made rum flow...?"

    def get_description(self) -> str:
        return """
This one be a bit complicated.  There's this shanty we used to sing that sounded a lot like \
\x1b]8;;https://www.youtube.com/watch?v=qP-7GNoDJ5c\x1b\\this\x1b]8;;\x1b\\, but it be about computin' an optimal \
distribution flow for rum.  (A right good cause, if ye ask me.)

Specifically, there be a graph on the heap composed of the followin' structures:

struct island {
    int32 id;
    ll* edges;
}

struct ll {
    ll* next;
    shipping_lane* edge;
}

struct shipping_lane {
    island* target;
    int32 capacity;
}

The goal be to maximize the total flow from the island with id 0 (which be havin' infinite rum) to the island with id 1,
pointers to which be passed as two arguments on the stack.  At the end of the shellcode, the maximum flow should be
present in EAX.  Again, in me day we'd be usin' 32-bit x86, and ye need not worry about usin' ret or hlt.

Matey, if ye be able to do this, ye'll be comin' home with a right good haul of rum -- and a bit of treasure to boot!
        """.strip()

    def evaluate_poem(self, poem: Poem):
        lines = poem.lines()
        if len(lines) < 52:
            raise ValidationException(
                len(lines),
                lines[-1],
                "I be expectin' 52 lines, but yer poem be endin' early!",
            )
        if len(lines) > 52:
            raise ValidationException(
                len(lines),
                lines[52],
                "I be expectin' 52 lines, but yer poem be goin' on too long!",
            )

        rhyme_scheme = "".join(x[0] for x in wellerman)
        stress_pattern = [x[1] for x in wellerman]
        rhyme_groups = validate_poem(poem, rhyme_scheme, stress_pattern)

        found_all_distinct = False
        for p in product(*rhyme_groups.values()):
            if len(set(p)) == len(p):
                found_all_distinct = True
                break

        if not found_all_distinct:
            raise ValidationException(
                len(lines),
                lines[-1],
                "I be expectin' all the rhymes to be unique, but yer poem be repeatin' a rhyme!",
            )

    def evaluate_shellcode(self, shellcode: bytes):
        for t in range(50):
            emu = unicorn.Uc(unicorn.UC_ARCH_X86, unicorn.UC_MODE_32)

            stack_base = 0x7FFFE000
            stack_size = 0x2000
            emu.mem_map(stack_base, stack_size)
            emu.mem_write(stack_base, b"\x00" * stack_size)

            heap_base = 0x50000000
            heap_size = 0x100000
            emu.mem_map(heap_base, heap_size)
            emu.mem_write(heap_base, b"\x00" * heap_size)

            current_heap_pos = heap_base

            def malloc(size):
                nonlocal current_heap_pos
                required_size = ceil((size + 1) / 8) * 8
                ret = current_heap_pos + 4
                emu.mem_write(current_heap_pos, struct.pack("<I", required_size | 1))
                current_heap_pos += required_size
                return ret

            nodes: int
            edges: npt.NDArray[np.int32]  # (nodes, nodes)
            if t < len(static_tests):
                edges = static_tests[t]
                nodes = edges.shape[0]
            else:
                nodes = t if t <= 40 else 50
                edge_density = 0.5 if t <= 40 else (t - 40) / 10
                edge_exists = np.random.random_sample((nodes, nodes)) < edge_density
                edges = np.random.randint(1, 20, (nodes, nodes))
                edges[~edge_exists] = 0
                edges[np.diag_indices(nodes)] = 0

            """
			structs:

			struct node {
				int32 id;
				ll* edges;
			}

			struct ll {
				ll* next;
				halfedge* edge;
			}

			struct halfedge {
				node* target;
				int32 capacity;
			}
			"""

            sizeof_node = 8
            sizeof_ll = 8
            sizeof_halfedge = 8

            node_addrs = [malloc(sizeof_node) for _ in range(nodes)]

            for i, addr in enumerate(node_addrs):
                emu.mem_write(addr, struct.pack("<I", i))

            node_ll_addrs = [0 for addr in node_addrs]

            for i in range(nodes):
                for j in range(i + 1, nodes):
                    if edges[i][j] != 0 or edges[j][i] != 0:
                        fwd_halfedge_addr = malloc(sizeof_halfedge)
                        bwd_halfedge_addr = malloc(sizeof_halfedge)
                        emu.mem_write(
                            fwd_halfedge_addr,
                            struct.pack(
                                "<II", node_addrs[j], edges[i][j]
                            ),
                        )
                        emu.mem_write(
                            bwd_halfedge_addr,
                            struct.pack(
                                "<II", node_addrs[i], edges[j][i]
                            ),
                        )
                        fwd_ll_addr = malloc(sizeof_ll)
                        bwd_ll_addr = malloc(sizeof_ll)
                        emu.mem_write(
                            fwd_ll_addr,
                            struct.pack("<II", node_ll_addrs[i], fwd_halfedge_addr),
                        )
                        emu.mem_write(
                            bwd_ll_addr,
                            struct.pack("<II", node_ll_addrs[j], bwd_halfedge_addr),
                        )
                        node_ll_addrs[i] = fwd_ll_addr
                        node_ll_addrs[j] = bwd_ll_addr

            for node_addr, ll_addr in zip(node_addrs, node_ll_addrs):
                emu.mem_write(node_addr + 4, struct.pack("<I", ll_addr))

            code_base = 0x1000
            code_size = 0x1000
            emu.mem_map(code_base, code_size)
            emu.mem_write(code_base, shellcode)

            emu.reg_write(
                unicorn.x86_const.UC_X86_REG_ESP, stack_base + stack_size - 128
            )
            emu.reg_write(
                unicorn.x86_const.UC_X86_REG_EBP, stack_base + stack_size - 128
            )
            emu.mem_write(
                stack_base + stack_size - 128 + 8,
                struct.pack("<II", node_addrs[0], node_addrs[1]),
            )

            max_flow_solver = SimpleMaxFlow()
            edge_endpoints = np.argwhere(edges != 0)
            edge_weights = edges[edges != 0]
            max_flow_solver.add_arcs_with_capacity(
                edge_endpoints[:, 0], edge_endpoints[:, 1], edge_weights
            )
            assert max_flow_solver.solve(0, 1) == max_flow_solver.OPTIMAL
            max_flow = max_flow_solver.optimal_flow()

            try:
                emu.emu_start(
                    code_base,
                    code_base + len(shellcode),
                    timeout=3 * unicorn.UC_SECOND_SCALE,
                )
            except Exception as e:
                raise ChallengeException(
                    "On this graph:\n"
                    + "\n"
                    + str(edges)
                    + "\n"
                    + "\n"
                    + f"Yer shellcode walked the plank: {e}"
                )

            if emu.reg_read(unicorn.x86_const.UC_X86_REG_EIP) != code_base + len(
                shellcode
            ):
                raise ChallengeException(
                    "On this graph:\n"
                    + "\n"
                    + str(edges)
                    + "\n"
                    + "\n"
                    + "Yer shellcode be loopin' or somethin'."
                )
            output = emu.reg_read(unicorn.x86_const.UC_X86_REG_EAX)

            if output != max_flow:
                raise ChallengeException(
                    "On this graph:\n"
                    + "\n"
                    + str(edges)
                    + "\n"
                    + "\n"
                    + f"Yer shellcode be returnin' {output}, but I be expectin' {max_flow}."
                )
