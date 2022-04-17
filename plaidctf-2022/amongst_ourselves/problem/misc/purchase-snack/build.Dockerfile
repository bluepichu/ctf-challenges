FROM ubuntu:20.04

WORKDIR /chal
RUN apt-get update && apt-get install -y gcc
COPY vending.c .
RUN gcc vending.c -o vending -fno-stack-protector -no-pie
CMD ["echo", "You probably didn't want to run this"]
