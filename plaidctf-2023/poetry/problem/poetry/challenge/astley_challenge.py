import difflib
from typing import Any

import unicorn  # type: ignore

from ..poetry import Poem
from ..validation import validate_poem, ValidationException
from .challenge import Challenge, ChallengeException

chorus = [
    # Never gonna give you up
    ("a", "1010111"),
    # Never gonna let you down
    ("b", "1010111"),
    # Never gonna run around and desert you
    ("c", "10101010011"),
    # Never gonna make you cry
    ("d", "1010111"),
    # Never gonna say goodbye
    ("d", "10101_1"),
    # Never gonna tell a lie and hurt you
    ("c", "1010101011"),
]

astley = [  # To the tune of "Never Gonna Give You Up" (Rick Astley)
    # We're no strangers to love
    ("e", "101001"),
    # You know the rules and so do I
    ("f", "01010?0101"),
    # A full commitment's what I'm thinking of
    ("e", "0101010101"),
    # You wouldn't get this from any other guy
    ("f", "01010110101"),
    #
    # I just wanna tell you how I'm feeling
    ("g", "1100100110?0"),
    # Gotta make you understand
    ("h", "1001_01"),
    #
    *chorus,
    #
    # We've known each other for so long
    ("i", "01010101"),
    # Your heart's been aching but you're too shy to say it
    ("j", "01010010101_"),
    # Inside we both know what's been going on
    ("i", "0101010101"),
    # We know the game and we're gonna play it
    ("j", "0101011011"),
    #
    # And if you ask me how I'm feeling
    ("g", "100101010?0"),
    # Don't tell me you're too blind to see
    ("k", "01010101"),
    #
    *chorus,
    *chorus,
    #
    #
    # We've known each other for so long
    ("i", "01010101"),
    # Your heart's been aching but you're too shy to say it
    ("j", "01010010101_"),
    # Inside we both know what's been going on
    ("i", "0101010101"),
    # We know the game and we're gonna play it
    ("j", "0101011011"),
    #
    # I just wanna tell you how I'm feeling
    ("g", "1100100110?0"),
    # Gotta make you understand
    ("h", "1001_01"),
    #
    *chorus,
    *chorus,
    *chorus,
]


def bottles_of_beer() -> str:
    ret = ""

    def bottle(n: int) -> str:
        return f"{n} bottle{'' if n == 1 else 's'}"

    for i in range(99, 0, -1):
        ret += f"{bottle(i)} of beer on the wall\n"
        ret += f"{bottle(i)} of beer\n"
        ret += "Take one down, pass it around\n"
        ret += f"{bottle(i-1)} of beer on the wall\n\n"
    return ret


class AstleyChallenge(Challenge):
    def get_summary(self) -> str:
        return "Astley: One of me hearties named Rick liked to stand in front of a fence..."

    def get_description(self) -> str:
        return """
A tale within a tale, a story within a story, a poem within a poem, a riddle within a riddle, a challenge within a challenge.

You might've heard the \x1b]8;;https://www.youtube.com/watch?v=dQw4w9WgXcQ\x1b\\classic\x1b]8;;\x1b\\, but have you heard the one it inspired? I be thinkin' not!

It be an alcoholic's dream, a pirate's nightmare, and a poet's challenge. I be expectin' many a bottles of beer. Don't be lettin' me down!
        """.strip()

    def evaluate_poem(self, poem: Poem):
        lines = poem.lines()
        if len(lines) < len(astley):
            raise ValidationException(
                len(lines),
                lines[-1],
                f"I be expectin' {len(astley)} lines, but yer poem be endin' early!",
            )
        if len(lines) > len(astley):
            raise ValidationException(
                len(lines),
                lines[len(astley)],
                f"I be expectin' {len(astley)} lines, but yer poem be goin' on too long!",
            )

        rhyme_scheme = "".join(x[0] for x in astley)
        stress_pattern = [x[1] for x in astley]
        validate_poem(poem, rhyme_scheme, stress_pattern)

    def evaluate_shellcode(self, shellcode: bytes):
        emu = unicorn.Uc(unicorn.UC_ARCH_X86, unicorn.UC_MODE_32)

        stack_base = 0x7FFFE000
        stack_size = 0x2000
        emu.mem_map(stack_base, stack_size)
        emu.mem_write(stack_base, b"\x00" * stack_size)

        code_base = 0x1000
        code_size = 0x1000
        emu.mem_map(code_base, code_size)
        emu.mem_write(code_base, shellcode)

        emu.reg_write(unicorn.x86_const.UC_X86_REG_ESP, stack_base + stack_size - 128)
        emu.reg_write(unicorn.x86_const.UC_X86_REG_EBP, stack_base + stack_size - 128)

        output = b""

        def hook_syscall(uc: unicorn.Uc, intno: int, user_data: Any):
            nonlocal output
            syscall = uc.reg_read(unicorn.x86_const.UC_X86_REG_EAX)
            if syscall == 4:  # write
                fd = uc.reg_read(unicorn.x86_const.UC_X86_REG_EBX)
                buf = uc.reg_read(unicorn.x86_const.UC_X86_REG_ECX)
                count = uc.reg_read(unicorn.x86_const.UC_X86_REG_EDX)
                if fd == 1:
                    output += uc.mem_read(buf, count)
            else:
                raise Exception(f"Unknown syscall {syscall}")

        emu.hook_add(unicorn.UC_HOOK_INTR, hook_syscall)

        try:
            emu.emu_start(
                code_base,
                code_base + len(shellcode),
                timeout=3 * unicorn.UC_SECOND_SCALE,
            )
        except Exception as e:
            raise ChallengeException(f"Yer shellcode walked the plank: {e}")

        expected = bottles_of_beer()
        if output != expected.encode("utf-8"):
            print("Yer output:")
            try:
                print(output.decode("utf-8"))
                diff = difflib.unified_diff(
                    expected.splitlines(),
                    output.decode("utf-8").splitlines(),
                )
                print("\n".join(diff))
            except UnicodeDecodeError:
                print(output)
            raise ChallengeException("Yer shellcode walked the plank")
