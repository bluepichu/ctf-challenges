EXCLUDE = --exclude .mypy_cache --exclude .ruff_cache --exclude .venv --exclude Makefile --exclude input_asm --exclude __pycache__ --exclude .envrc --exclude shell.nix --exclude handout.tar.gz

all: handout.tar.gz

handout.tar.gz:
	tar -czf handout.tar.gz $(EXCLUDE) .
