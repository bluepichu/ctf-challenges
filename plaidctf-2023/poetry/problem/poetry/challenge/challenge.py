from abc import ABC, abstractmethod

from ..poetry import Poem
from .challenge_exception import ChallengeException


class Challenge(ABC):
    @abstractmethod
    def get_summary(self) -> str:
        pass

    @abstractmethod
    def get_description(self) -> str:
        pass

    @abstractmethod
    def evaluate_poem(self, poem: Poem):
        pass

    @abstractmethod
    def evaluate_shellcode(self, shellcode: bytes):
        pass

    def evaulate(self, poem: Poem, shellcode: bytes):
        try:
            self.evaluate_poem(poem)
        except Exception as e:
            raise e
            raise ChallengeException("Yer poem not be poetic enough.")

        try:
            self.evaluate_shellcode(shellcode)
        except Exception:
            raise Exception("Yer shellcode not be computin' what I asked for.")
