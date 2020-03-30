FROM node:13

RUN mkdir -p /usr/src/notifications-api/
WORKDIR /usr/src/notifications-api/

COPY . /usr/src/notifications-api/package.json
RUN npm install

COPY . /usr/src/notifications-api/

CMD ["node", "app.js"]
