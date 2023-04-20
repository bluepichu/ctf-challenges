from ..poetry import Line


class ValidationException(Exception):
    position: int
    line: Line
    message: str

    def __init__(self, position: int, line: Line, message: str):
        self.position = position
        self.line = line
        self.message = message
