from typing import Iterable
from .phoneme import Phoneme, Vowel

from ..solver import RegexChunk


class Word:
    phonemes: list[list[Phoneme]]

    def __init__(self, pronunciations: list[list[Phoneme]]):
        self.pronunciations = pronunciations

    def __str__(self) -> str:
        p = [" ".join(str(p) for p in pron) for pron in self.pronunciations]
        if len(p) == 1:
            return p[0]
        return f"({' | '.join(p)})"

    def __repr__(self) -> str:
        return str(self)

    def __pretty__(self) -> str:
        p = [" ".join(p.__pretty__() for p in pron) for pron in self.pronunciations]

        before = "\x1b[4m"  # underline
        after = "\x1b[24m"  # end underline

        if len(p) == 1:
            return before + p[0] + after
        return before + "(" + " | ".join(p) + ")" + after

    def get_pronunciations(self) -> Iterable[list[Phoneme]]:
        for pronunciation in self.pronunciations:
            yield pronunciation

    def to_rc_stress(self) -> RegexChunk[bool]:
        return RegexChunk.union(
            *[
                RegexChunk.concat(
                    *[
                        phoneme.to_rc_stress()
                        for phoneme in pronunciation
                        if isinstance(phoneme, Vowel)
                    ]
                )
                for pronunciation in self.pronunciations
            ]
        )
