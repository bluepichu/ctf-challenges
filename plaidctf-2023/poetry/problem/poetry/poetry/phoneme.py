from abc import ABC, abstractmethod
from typing import Iterable, Union

from ..solver import RegexChunk

vowel_sounds = [
    "AA",
    "AE",
    "AH",
    "AO",
    "AW",
    "AX",
    "AY",
    "EH",
    "ER",
    "EY",
    "IH",
    "IY",
    "OW",
    "OY",
    "UH",
    "UW",
]
consonant_sounds = [
    "B",
    "CH",
    "D",
    "DH",
    "F",
    "G",
    "HH",
    "JH",
    "K",
    "L",
    "M",
    "N",
    "NG",
    "P",
    "R",
    "S",
    "SH",
    "T",
    "TH",
    "V",
    "W",
    "Y",
    "Z",
    "ZH",
]


class Phoneme(ABC):
    @abstractmethod
    def get_options(self) -> Iterable[str]:
        pass

    @abstractmethod
    def get_normalized_sound(self) -> str:
        pass

    @abstractmethod
    def to_rc_sound(self) -> RegexChunk[str]:
        pass

    @abstractmethod
    def __pretty__(self) -> str:
        pass


class Consonant(Phoneme):
    sound: str

    def __init__(self, sound: str):
        assert sound in consonant_sounds, f"Invalid consonant sound: {sound}"
        self.sound = sound

    def __str__(self) -> str:
        return self.sound

    def __repr__(self) -> str:
        return str(self)

    def __pretty__(self) -> str:
        return f"\x1b[34m{self.sound}\x1b[39m"  # 34m is blue, 39m is default

    def get_options(self) -> Iterable[str]:
        yield self.sound

    def get_normalized_sound(self) -> str:
        return self.sound if len(self.sound) == 2 else " " + self.sound

    def to_rc_sound(self) -> RegexChunk[str]:
        return RegexChunk.literal(self.sound)


class Vowel(Phoneme):
    sound: str
    stressed: Union[bool, None]

    def __init__(self, sound: str, stressed: Union[bool, None]):
        assert sound in vowel_sounds, f"Invalid vowel sound: {sound}"
        self.sound = sound
        self.stressed = stressed

    def __str__(self) -> str:
        if self.stressed is True:
            return self.sound + "1"
        elif self.stressed is False:
            return self.sound + "0"
        else:
            return self.sound + "_"

    def __repr__(self) -> str:
        return str(self)

    def __pretty__(self) -> str:
        x = f"\x1b[33m{str(self)}\x1b[39m"  # 33m is yellow, 39m is default
        if self.stressed is True:
            return f"\x1b[1m{x}\x1b[22m"  # 1m is bold, 22m is normal
        elif self.stressed is False:
            return f"\x1b[2m{x}\x1b[22m"  # 2m is dim, 22m is normal
        else:
            return x

    def get_options(self) -> Iterable[str]:
        if self.stressed is not True:
            yield self.sound + "0"
        if self.stressed is not False:
            yield self.sound + "1"

    def get_normalized_sound(self) -> str:
        return self.sound

    def to_rc_sound(self) -> RegexChunk[str]:
        return RegexChunk(self.sound)

    def to_rc_stress(self) -> RegexChunk[bool]:
        if self.stressed is None:
            return RegexChunk.union(RegexChunk.literal(True), RegexChunk.literal(False))
        else:
            return RegexChunk.literal(self.stressed)
