FROM ubuntu:20.04

WORKDIR /chal
RUN apt-get update && apt-get install -y gcc xinetd
COPY engine.c .
RUN gcc engine.c -o engine
RUN strip engine
CMD ["echo", "You probably didn't want to run this"]
