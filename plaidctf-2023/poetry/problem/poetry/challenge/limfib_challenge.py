import struct
from random import randint

import unicorn  # type: ignore

from ..poetry import Poem
from ..validation import validate_poem, ValidationException
from .challenge import Challenge
from .challenge_exception import ChallengeException


class LimFibChallenge(Challenge):
    def get_summary(self) -> str:
        return "LimFib: there was this one limerick I used to know..."

    def get_description(self) -> str:
        return """
I remember in me old crew that we used to have this poem we'd recite.  It was a limerick, meanin' it had a rhyme and \
stress structure like this:

A 00?100?100?10?0?
A 00?100?100?10?0?
B 00?10010?
B 00?10010?
A 00?100?100?10?0?

The A lines have to rhyme with each other, and the B lines have to rhyme with each other, but the A lines don't have \
to rhyme with the B lines.  In the stress patterns, a 1 be a stressed syllable and a 0 be an unstressed syllable.  \
A syllable followed by a question mark be optional.

Anywho, I recall the limerick be about computin' Fibonacci numbers.  Ye know, fib(1) = 1, fib(2) = 1, fib(3) = 2, \
fib(4) = 3, and so on.  The argument be on the stack after the return address, and the limerick be returnin' the \
result in EAX.  Also, know that back in me day, we be usin' only 32-bit x86, and that ye need not call hlt or ret; \
I'll be checkin' yer result once EIP exits yer shellcode.

If ye can remind me of the limerick, I'll make it worth yer while in treasure!
        """.strip()

    def fib(self, n: int):
        a, b = 0, 1
        for _ in range(n):
            a, b = b, a + b
            a &= 0xFFFFFFFF
            b &= 0xFFFFFFFF
        return a

    def evaluate_poem(self, poem: Poem):
        lines = poem.lines()
        if len(lines) < 5:
            raise ValidationException(
                len(lines), lines[-1], "Last I be checkin', a limerick be 5 lines."
            )
        if len(lines) > 5:
            raise ValidationException(
                len(lines), lines[5], "Last I be checkin', a limerick be 5 lines."
            )

        stress_a = "00?100?100?10?0?"
        stress_b = "00?10010?"
        rhyme_groups = validate_poem(
            poem, "aabba", [stress_a, stress_a, stress_b, stress_b, stress_a]
        )
        if (
            len(rhyme_groups["a"]) == 1
            and len(rhyme_groups["b"]) == 1
            and rhyme_groups["a"] == rhyme_groups["b"]
        ):
            print(
                "\x1b[90mYer A lines and yer B lines be rhyming with each other, but we can overlook that for now.\x1b[0m"
            )

    def evaluate_shellcode(self, shellcode: bytes):
        for i in range(1, 100):
            input = i if i < 50 else randint(100, 1000)
            emu = unicorn.Uc(unicorn.UC_ARCH_X86, unicorn.UC_MODE_32)
            stack_base = 0x7FFFE000
            stack_size = 0x2000
            code_base = 0x1000
            emu.mem_map(stack_base, stack_size)
            emu.mem_write(stack_base, b"\x00" * stack_size)
            emu.mem_map(code_base, 0x1000)
            emu.mem_write(code_base, shellcode)
            emu.reg_write(
                unicorn.x86_const.UC_X86_REG_ESP, stack_base + stack_size - 128
            )
            emu.reg_write(
                unicorn.x86_const.UC_X86_REG_EBP, stack_base + stack_size - 128
            )
            emu.mem_write(stack_base + stack_size - 128 + 4, struct.pack("<I", input))

            try:
                emu.emu_start(
                    code_base,
                    code_base + len(shellcode),
                    timeout=1 * unicorn.UC_SECOND_SCALE,
                )
            except Exception as e:
                raise ChallengeException(
                    f"When computin' fib({input}), yer shellcode walked the plank: {e}"
                )

            if emu.reg_read(unicorn.x86_const.UC_X86_REG_EIP) != code_base + len(
                shellcode
            ):
                raise ChallengeException(
                    f"When computin' fib({input}), yer shellcode be loopin' or be crashin'."
                )

            output = emu.reg_read(unicorn.x86_const.UC_X86_REG_EAX)

            if output != self.fib(input):
                raise ChallengeException(
                    f"When computin' fib({input}), yer shellcode be returnin' {output}, but I be expectin' {self.fib(input)}."
                )
