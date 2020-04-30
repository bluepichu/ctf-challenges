#!/bin/bash

mkdir bttf
cp worker/files/ld.so bttf
cp worker/files/libc.so.4.7.6 bttf
cp worker/files/netscape bttf/back_to_the_future
tar -cvf bttf.tar.gz bttf
rm -rf bttf
