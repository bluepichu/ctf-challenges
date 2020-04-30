FROM node:lts

WORKDIR /frontend
COPY . .
RUN yarn install
RUN yarn build
CMD yarn start
