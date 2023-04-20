import os
from datetime import datetime
from typing import Optional
import uuid
import argparse

from .assembly import parse_assembly, assembly_to_bytes, assembly_to_poem
from .challenge import (
    LimFibChallenge,
    WellermanChallenge,
    ChallengeException,
    AstleyChallenge,
)
from .poetry import Line
from .validation import ValidationException
from .playground import playground

# Command line args are for convenience when running locally.
# The remote version will always run with no command line flags (see Dockerfile).
parser = argparse.ArgumentParser()
parser.add_argument("challenge_id", type=int, help="The challenge ID", nargs="?")
parser.add_argument("input_file", type=str, help="The input file", nargs="?")
parser.add_argument(
    "-s",
    "--shellcode-only",
    action="store_true",
    help="Only validate the shellcode's functionality",
)
parser.add_argument(
    "-p", "--poem-only", action="store_true", help="Only validate the poem's structure"
)
args = parser.parse_args()

if args.shellcode_only and args.poem_only:
    print("Ye can't be doin' both, matey!")
    exit(1)

challenges = [
    LimFibChallenge(),
    AstleyChallenge(),
    WellermanChallenge(),
]

flags = [
    os.getenv("FLAG1", "pctf{flag1}"),
    os.getenv("FLAG2", "pctf{flag2}"),
    os.getenv("FLAG3", "pctf{flag3}"),
]

print(
    """
\x1b[3;36mAhoy, matey!  Back in me day, I used to be a pirate.  I'd be sailin' the seven seas, plunderin' ships, and \
drinkin' fine rum.  Nowadays, though, I be retired, livin' of the treasure I plundered in me youth.

I be thinkin' about me time on the seas, and I remember how we used to pass the time on long voyages with songs and \
poetry.  I be longin' for the days of me youth, and I be wantin' to hear some of that poetry again.  But avast!  Me \
memory be not what it used to be, and me crew's long dispersed.

If ye can help remind me of the poetry I used to hear, then I be willin' to compensate ye handsomely!\x1b[0m
""".strip()
)
print()

challenge_id: Optional[int] = args.challenge_id

if challenge_id is None:
    print("Select yer challenge:")

    print(
        f"  \x1b[33m[0]\x1b[0m Playground: explore the high seas, carefree, and without consequence..."
    )
    for i, challenge in enumerate(challenges):
        print(f"  \x1b[33m[{i+1}]\x1b[0m {challenge.get_summary()}")

    print()

    challenge_id = int(input("> "))
    print()

if challenge_id == 0:
    playground()
    exit(0)

if not (1 <= challenge_id <= len(challenges)):
    print("What ye be talkin' about, matey?")
    exit(1)

challenge = challenges[challenge_id - 1]
flag = flags[challenge_id - 1]

print(challenge.get_description())
print()
print(
    """
\x1b[2mI be expectin' assembly with slashes between each instruction, and newlines where they belong in the poem. \
Fer example:

pop eax/pop ebx/nop/
add eax, ebx/pop
ecx/add ecx, eax/
mov eax, ecx

Note that ye can split an instruction across multiple lines.  Also, ye need not ret or hlt at the end of yer shellcode.
\x1b[0m
""".strip()
)

input_asm: str

if args.input_file is not None:
    with open(args.input_file) as f:
        input_asm = f.read()
else:
    print(
        '\x1b[33mEnter yer assembly, followed by a line containing only "EOF":\x1b[0m'
    )
    input_asm = ""
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line == "EOF":
            break
        input_asm += line + "\n"
    print()

if len(input_asm) > 100000:
    print("Ye be talkin' too much, matey!")
    exit(1)

dir_name = f"input_asm/{challenge_id}/{datetime.now().strftime('%Y-%m-%d-%H-%M')}"
os.makedirs(dir_name, exist_ok=True)
with open(f"{dir_name}/{uuid.uuid4()}.asm", "w") as f:
    f.write(input_asm)

assembly = parse_assembly(input_asm)

if not args.shellcode_only:
    try:
        poem = assembly_to_poem(assembly)

        if len(poem.lines()) == 0:
            raise ValidationException(1, Line([]), "Yer poem be empty!")

        challenge.evaluate_poem(poem)
    except ValidationException as e:
        print(
            f"\x1b[1;31mYer poem not be poetic enough.\x1b[0m  The issue be on line {e.position}:"
        )
        print()
        print(e.line.__pretty__())
        print()
        print(e.message)
        exit(1)
    except Exception as e:
        print("\x1b[1;31mYer poem not be poetic enough.\x1b[0m")
        print()
        raise e
    else:
        print("\x1b[1;32mYer poem be just right!\x1b[0m")

if not args.poem_only:
    try:
        challenge.evaluate_shellcode(assembly_to_bytes(assembly))
    except ChallengeException as e:
        print("\x1b[1;31mYer shellcode not be computin' what I asked fer.\x1b[0m")
        print()
        print(e.message)
        exit(1)
    except Exception as e:
        print("\x1b[1;31mYer shellcode not be computin' what I asked fer.\x1b[0m")
        print()
        raise e
    else:
        print("\x1b[1;32mYer shellcode be just right!\x1b[0m")

if args.poem_only or args.shellcode_only:
    print(
        "\x1b[1;33mThat be right so far, but we be needin' both the poem and the shellcode to be workin'!\x1b[0m"
    )
    exit(1)

print()
print(
    "\x1b[1;33mThat's exactly what I be looking for!  Take this treasure, matey, ye've earned it!\x1b[0m"
)
print("\x1b[1;36m" + flag + "\x1b[0m")
