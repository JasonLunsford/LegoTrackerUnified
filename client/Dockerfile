FROM node:12
WORKDIR /client
COPY package.json /client/package.json
RUN npm install
COPY . /client

EXPOSE 8080
CMD [ "npm", "start" ]