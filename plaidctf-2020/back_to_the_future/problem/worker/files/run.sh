#! /bin/bash

export DISPLAY=:1
Xvfb $DISPLAY -screen 0 1024x768x16 &
sleep 2
./netscape $URL
