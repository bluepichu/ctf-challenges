from ..assembly import parse_assembly, assembly_to_poem
from typing import Optional


def next_line() -> bool:
    """Get and handle the next line of input."""
    try:
        line = input("> ").strip()
    except EOFError:
        line = "quit"
        print("quit")
    if line == "quit":
        return False

    if len(line) == 0:
        return True

    if len(line) > 10000:
        print(
            "Singing single line ballads, are we? I like your style, but I'm afraid I can't handle that much."
        )
        return True

    if line[0] == "#":
        return True

    try:
        assembly = parse_assembly(line)
        poem = assembly_to_poem(assembly)
        assert len(poem.lines()) == 1
        print(poem.lines()[0].__pretty__())
        print()
        return True
    except Exception as e:
        print("You what mate?")
        print("  " + "\n  ".join(str(e).split("\n")))
        print()
        return True


def playground():
    """Playground for poetry problem."""

    print("I see you have chosen to live life without worries, nor consequences.")
    print("May your belly be full of rum, and your heart be full of song.")
    print()

    print("You may now enter your assembly code. Type 'quit' to exit.")
    print()

    while next_line():
        pass
