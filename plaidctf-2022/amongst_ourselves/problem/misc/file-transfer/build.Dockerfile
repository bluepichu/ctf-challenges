FROM node:17

RUN apt-get update && apt-get install -y tcpdump curl
WORKDIR /files
COPY sus.png .
COPY run.sh .
CMD ["./run.sh"]
