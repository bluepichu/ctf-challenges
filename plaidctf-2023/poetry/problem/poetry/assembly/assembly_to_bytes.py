from lark import Transformer, Token as LarkToken, Discard, ParseTree  # type: ignore
from typing import Any
import keystone  # type: ignore


class AsmTransformer(Transformer[Any, str]):
    def _first_child(self, children: list[str]) -> str:
        assert len(children) == 1
        return children[0]

    def _first_child_leaf(self, children: list[LarkToken]) -> str:
        assert len(children) == 1
        return children[0].value

    def _discard(self, children: list[LarkToken]):
        return Discard

    line = _first_child
    prefix = _first_child
    opcode = _first_child
    operand = _first_child
    label = _first_child
    register = _first_child
    immediate = _first_child
    base10_immediate = _first_child
    base16_immediate = _first_child
    size_keyword = _first_child
    ptr_keyword = _first_child
    plus = _first_child
    plus_or_minus = _first_child
    index = _first_child
    times = _first_child
    offset = _first_child

    POETRY_EOL = _discard
    EOL = _discard

    def shellcode(self, children: list[str]) -> str:
        return "\n".join(children)

    def instruction(self, children: list[str]) -> str:
        return " ".join(children)

    def operands(self, children: list[str]) -> str:
        return ", ".join(children)

    def indirect(self, children: list[str]) -> str:
        assert len(children) in (1, 2)
        if len(children) == 1:
            return f"[{children[0]}]"
        else:
            return f"{children[0]} [{children[1]}]"

    def indirect_expr(self, children: list[str]) -> str:
        assert 1 <= len(children) <= 5
        return "".join(children)

    def indirect_size(self, children: list[str]) -> str:
        assert len(children) == 2
        return " ".join(children)

    def index_scale(self, children: list[str]) -> str:
        assert len(children) == 3
        return "".join(children)

    def scale_index(self, children: list[str]) -> str:
        assert len(children) == 3
        return "".join(children)

    def label_declaration(self, children: list[str]) -> str:
        assert len(children) == 1
        return f"{children[0]}:"

    def INT10(self, value: str) -> str:
        return str(int(value))

    def INT16(self, value: str) -> str:
        return hex(int(value, 16))


def assembly_to_bytes(assembly: ParseTree) -> bytes:
    transformer = AsmTransformer()
    asm = transformer.transform(assembly)

    ks = keystone.Ks(keystone.KS_ARCH_X86, keystone.KS_MODE_32)
    encoding, _count = ks.asm(asm)
    return bytes(encoding)
