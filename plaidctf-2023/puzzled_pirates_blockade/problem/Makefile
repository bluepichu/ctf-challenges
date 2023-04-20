EXCLUDE = --exclude=node_modules --exclude=.pnp.* --exclude=dist --exclude=*.turbo --exclude=.DS_Store --exclude=.yarn/cache --exclude=slingshot.yaml --exclude Makefile --exclude _assets

.PHONY: all

all: handout.tar.gz

handout.tar.gz: $(shell find . -type f)
	tar $(EXCLUDE) -cvzf handout.tar.gz .
