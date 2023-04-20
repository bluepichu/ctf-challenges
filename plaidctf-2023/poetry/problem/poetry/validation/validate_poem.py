from ..solver import RegexChunk
from ..poetry import Poem
from .validation_exception import ValidationException


def build_stress_rc(pattern: str) -> RegexChunk[bool]:
    parts: list[RegexChunk[bool]] = []
    assert (x in "01?_" for x in pattern)
    for c in pattern:
        if c == "0":
            parts.append(RegexChunk.literal(False))
        elif c == "1":
            parts.append(RegexChunk.literal(True))
        elif c == "?":
            parts[-1] = RegexChunk.optional(parts[-1])
        elif c == "_":
            parts.append(
                RegexChunk.union(RegexChunk.literal(False), RegexChunk.literal(True))
            )
        else:
            raise ValueError(f"Invalid stress pattern character: {c}")
    return RegexChunk.concat(*parts)


def validate_poem(
    poem: Poem, rhyme_scheme: str, stress_patterns: list[str]
) -> dict[str, set[str]]:
    assert len(rhyme_scheme) == len(stress_patterns)
    lines = poem.lines()
    assert len(rhyme_scheme) == len(lines)

    allowed_stresses = []
    for i, (line, stress_pattern) in enumerate(zip(lines, stress_patterns)):
        stresses = [
            "".join("01"[y] for y in x)
            for x in line.to_rc_stress().possibilities_in_intersection(
                build_stress_rc(stress_pattern)
            )
        ]
        allowed_stresses.append(stresses)
        if len(stresses) == 0:
            raise ValidationException(
                i + 1, lines[i], f"The stress pattern {stress_pattern} be impossible!"
            )

    suffixes: list[set[str]] = []
    for i, stresses in enumerate(allowed_stresses):
        suffixes.append(set())
        for stress in stresses:
            assert len(suffixes) == i + 1
            suffixes[i].update(lines[i].possible_rhyme_suffixes(stress))

    rhyme_groups = {}
    for i, suffix in enumerate(suffixes):
        if rhyme_scheme[i] not in rhyme_groups:
            rhyme_groups[rhyme_scheme[i]] = suffix
        else:
            old_suffix = rhyme_groups[rhyme_scheme[i]]
            rhyme_groups[rhyme_scheme[i]] = old_suffix.intersection(suffix)
            if len(rhyme_groups[rhyme_scheme[i]]) == 0:
                raise ValidationException(
                    i + 1,
                    lines[i],
                    f"The rhyme scheme be off; I be expectin' one of {old_suffix}, but I be gettin' {suffix}!",
                )

    return rhyme_groups
