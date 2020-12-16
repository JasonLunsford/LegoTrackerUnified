FROM node:12-alpine
WORKDIR /api
COPY package.json /api/package.json
RUN apk --no-cache add --virtual builds-deps build-base python
RUN npm install --only=prod
COPY . /api

EXPOSE 8181
USER node
CMD ["npm", "start"]