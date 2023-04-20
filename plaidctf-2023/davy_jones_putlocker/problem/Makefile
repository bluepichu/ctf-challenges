PASSPHRASE = a918eb11ebc220a0acf3f77634619a74 # this comes from the end of the flag in part 1
EXCLUDE = --exclude=node_modules --exclude=.pnp.* --exclude=dist --exclude=data --exclude=*.turbo --exclude=.DS_Store --exclude=.yarn/cache --exclude=slingshot.yaml

.PHONY: all

all: handout1.tar.gz handout2.tar.gz

handout1.tar.gz: part1
	tar $(EXCLUDE) -cvzf handout1.tar.gz part1

handout2.tar.gz: part2
	tar $(EXCLUDE) -cvzf handout2.tar.gz part2

# handout2.tar.gz.enc: part2
# 	tar $(EXCLUDE) -cvzf - part2 | openssl enc -aes-256-cbc -salt -pass pass:$(PASSPHRASE) -out handout2.tar.gz.enc
