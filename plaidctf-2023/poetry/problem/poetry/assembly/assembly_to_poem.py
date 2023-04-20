from lark import Transformer, Discard, ParseTree  # type: ignore
from ..poetry import Token, eol, get_word, Poem
from typing import Any


class PoemTransformer(Transformer[Any, list[Token]]):
    def _convert_to_word(self, value: str) -> list[Token]:
        return [get_word(value)]

    def __default__(
        self, data: Any, children: list[list[Token]], meta: Any
    ) -> list[Token]:
        return [token for child in children for token in child]

    PREFIX = _convert_to_word
    OPCODE = _convert_to_word
    REGISTER = _convert_to_word
    SIZE = _convert_to_word
    PTR = _convert_to_word
    PLUS = _convert_to_word
    MINUS = _convert_to_word
    TIMES = _convert_to_word

    def EOL(self, value: str):
        return Discard

    def POETRY_EOL(self, value: str) -> list[Token]:
        return [eol]

    def LABEL(self, value: str) -> list[Token]:
        return [get_word(value[1:])]

    def INT10(self, value: str) -> list[Token]:
        return [get_word(digit) for digit in str(int(value))]

    def INT16(self, value: str) -> list[Token]:
        return [get_word(digit) for digit in hex(int(value, 16))]


def assembly_to_poem(assembly: ParseTree) -> Poem:
    transformer = PoemTransformer()
    tokens = transformer.transform(assembly)
    return Poem(tokens)
