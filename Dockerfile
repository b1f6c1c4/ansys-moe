FROM node:9.11.1-alpine

WORKDIR /usr/src/ansys-petri
COPY package.json .
COPY yarn.lock .
RUN ["yarn", "install", "--production"]

COPY . .

CMD ["yarn", "start:prod"]
