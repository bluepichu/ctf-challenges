FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y gdb gcc build-essential gcc-multilib xvfb

RUN useradd -u 1000 bttf
WORKDIR /home/bttf
COPY files/netscape .
COPY files/run.sh .
COPY files/flag /flag
COPY files/ld.so /lib/ld.so
COPY files/libc.so.4.7.6 /lib/libc.so.4
COPY files/.MCOM-preferences .
COPY files/readflag.c .
RUN gcc readflag.c -o /readflag
RUN rm readflag.c
RUN chmod u+s /readflag
RUN chmod 400 /flag
RUN mkdir -p /home/bttf/.MCOM-cache
RUN mkdir -p /tmp/.X11-unix
RUN chmod 1777 /tmp/.X11-unix
RUN chown -R bttf:bttf /home/bttf

USER bttf
CMD ./run.sh
