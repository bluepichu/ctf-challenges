from typing import Union
from .eol import EOL
from .word import Word

Token = Union[EOL, Word]
