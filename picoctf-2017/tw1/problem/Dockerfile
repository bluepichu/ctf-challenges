FROM node:8
WORKDIR /tw
COPY package.json /tw
RUN npm install
COPY . .
CMD ["npm", "start"]