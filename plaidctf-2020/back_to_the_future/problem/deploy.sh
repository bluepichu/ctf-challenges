#!/bin/bash

set -e
docker build worker -t bttf-worker:latest
docker-compose build
docker-compose up -d
