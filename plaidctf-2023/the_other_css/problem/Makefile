FILES = Dockerfile docker-compose.yml .dockerignore css disks

handout.tar.gz: $(FILES)
	tar --exclude=.venv --exclude=__pycache__ --exclude=.DS_Store -cvf handout.tar.gz $(FILES)
