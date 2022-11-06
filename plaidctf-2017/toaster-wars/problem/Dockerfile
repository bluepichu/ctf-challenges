FROM node:8
WORKDIR /tw
RUN npm install -g gulp typescript
COPY package.json .
RUN npm install
COPY . .
RUN gulp
CMD ["node", "index.js"]
