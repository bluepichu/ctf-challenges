from .eol import eol
from .token import Token
from .line import Line
from .word import Word


class Poem:
    tokens: list[Token]

    def __init__(self, tokens: list[Token]):
        self.tokens = tokens

    def lines(self) -> list[Line]:
        lines: list[Line] = []
        line: list[Word] = []

        for token in self.tokens:
            if token is eol:
                if len(line) > 0:
                    lines.append(Line(line))
                    line = []
            else:
                line.append(token)

        if len(line) > 0:
            lines.append(Line(line))

        return lines

    def __pretty__(self) -> str:
        return "\n".join(map(lambda x: x.__pretty__(), self.lines()))
