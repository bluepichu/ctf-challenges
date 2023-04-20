from __future__ import annotations

from itertools import product

from .phoneme import Vowel
from .word import Word
from ..solver import RegexChunk


class Line:
    words: list[Word]

    def __init__(self, words: list[Word]):
        self.words = words

    def __str__(self):
        return "  ".join(map(str, self.words))

    def __repr__(self):
        return str(self)

    def __pretty__(self):
        return "  ".join(map(lambda x: x.__pretty__(), self.words))

    def to_rc_stress(self) -> RegexChunk[bool]:
        return RegexChunk.concat(*[word.to_rc_stress() for word in self.words])

    def possible_rhyme_suffixes(self, stress_pattern: str) -> set[str]:
        assert "1" in stress_pattern
        pronunciations = product(*[word.get_pronunciations() for word in self.words])
        vowel_start = len(stress_pattern) - stress_pattern[::-1].index("1")
        result = set()
        for pronunciation_ in pronunciations:
            pronunciation = [phoneme for word in pronunciation_ for phoneme in word]
            if sum(isinstance(phoneme, Vowel) for phoneme in pronunciation) != len(
                stress_pattern
            ):
                continue
            res = []
            vowel_count = 0
            for phoneme in pronunciation:
                if isinstance(phoneme, Vowel):
                    vowel_count += 1
                if vowel_count >= vowel_start:
                    res.append(phoneme)
            found_suffix = " ".join(map(lambda x: x.get_normalized_sound(), res))
            result.add(found_suffix)
        return result
