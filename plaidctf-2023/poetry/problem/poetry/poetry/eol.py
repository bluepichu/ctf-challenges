from enum import Enum


class EOL(Enum):
    token = 0

    def __repr__(self):
        return "<EOL>"


eol = EOL.token
