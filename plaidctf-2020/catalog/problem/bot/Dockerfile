FROM ubuntu:18.04

RUN apt update && apt install -y xvfb curl wget software-properties-common unzip
RUN add-apt-repository ppa:canonical-chromium-builds/stage
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt install -y nodejs chromium-browser=81.0.4044.92-0ubuntu0.18.04.1
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update && apt install -y yarn


WORKDIR /ublock
RUN wget https://github.com/gorhill/uBlock/releases/download/1.26.0/uBlock0_1.26.0.chromium.zip
RUN unzip uBlock0_1.26.0.chromium.zip
RUN rm uBlock0_1.26.0.chromium.zip

RUN useradd bot
RUN mkdir -p /home/bot
RUN chown bot:bot /home/bot
WORKDIR /home/bot
USER bot
COPY package.json .
RUN yarn install
COPY . .
CMD xvfb-run node index.js
