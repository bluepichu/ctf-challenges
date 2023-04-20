from os.path import dirname
from os.path import join as path_join

from .phoneme import Phoneme, Vowel, Consonant
from .word import Word

words: dict[str, Word]


def _to_vowel(sound: str) -> Phoneme:
    if sound[-1] == "_":
        return Vowel(sound[:-1], None)
    elif sound[-1] == "0":
        return Vowel(sound[:-1], False)
    elif sound[-1] == "1":
        return Vowel(sound[:-1], True)
    else:
        raise ValueError(f"Invalid vowel sound: {sound}")


def _to_consonant(sound: str) -> Phoneme:
    return Consonant(sound)


def _load_dictionary() -> None:
    global words
    word_list: dict[str, list[list[Phoneme]]] = {}

    with open(path_join(dirname(__file__), "dictionary.arpa"), "r") as f:
        for line in f:
            line = line.split("#", 1)[0].strip()

            if line == "":
                continue

            word, phonemes_s = line.strip().split(" ", 1)

            if word not in word_list:
                word_list[word] = []

            phonemes = [
                _to_vowel(p) if len(p) == 3 else _to_consonant(p)
                for p in phonemes_s.strip().split(" ")
            ]
            word_list[word].append(phonemes)

    words = {word: Word(phones) for word, phones in word_list.items()}


def get_word(word: str) -> Word:
    lookup = word.lstrip(".")
    if lookup not in words:
        raise ValueError(f"Unknown word: {word}")
    return words[lookup]


_load_dictionary()
