from lark import Lark, ParseTree  # type: ignore

shellcode_parser = Lark(
    r"""
shellcode: (line (EOL line)* EOL?)?
line: instruction | label_declaration
instruction: prefix? opcode operands?
prefix: POETRY_EOL? PREFIX
opcode: POETRY_EOL? OPCODE
operands: operand ("," operand)*
operand: label | register | immediate | indirect
label: POETRY_EOL? LABEL
register: POETRY_EOL? REGISTER
immediate: base10_immediate | base16_immediate
base10_immediate: POETRY_EOL? INT10
base16_immediate: POETRY_EOL? INT16
indirect: indirect_size? "[" indirect_expr "]"
indirect_expr: (register plus)? index (plus_or_minus offset)?
indirect_size: size_keyword ptr_keyword
size_keyword: POETRY_EOL? SIZE
ptr_keyword: POETRY_EOL? PTR
plus: POETRY_EOL? PLUS
plus_or_minus: POETRY_EOL? (PLUS | MINUS)
index: register | index_scale | scale_index
index_scale: register times immediate
scale_index: immediate times register
times: POETRY_EOL? TIMES
offset: immediate
label_declaration: label ":"

POETRY_EOL: "/"
LABEL: "." /[a-z]+/
OPCODE: /[a-z]+/
REGISTER: /[a-z]+/
PREFIX: "rep" | "repnz" | "repz" | "repe" | "repne"
SIZE: "byte" | "word" | "dword"
INT10: /[0-9]+/
INT16: "0x" /[0-9a-f]+/
PTR: "ptr"
PLUS: "+"
MINUS: "-"
TIMES: "*"

EOL: /\n/
WHITESPACE: /[ \t]+/
COMMENT: ";" /[^\n]*/

%ignore WHITESPACE
%ignore COMMENT
""",
    start="shellcode",
)


def strip_poem_comments(s: str) -> str:
    import re

    return re.sub(r"^#.*$", "", s, flags=re.MULTILINE)


def remove_all_empty_lines(s: str) -> str:
    while True:
        s = s.replace("\n\n", "\n")
        if "\n\n" not in s:
            break
    return s


def parse_assembly(assembly: str) -> ParseTree:
    assembly = strip_poem_comments(assembly)
    assembly = remove_all_empty_lines(assembly)
    assembly = (
        assembly.strip()
        .replace("/", "\x00")  # swap poem EOL with actual EOL
        .replace("\n", "/")
        .replace("\x00", "\n")
        .strip()
    )

    return shellcode_parser.parse(assembly)
