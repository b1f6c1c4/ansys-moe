FROM node:9.11.1

COPY . .

CMD ["yarn", "install", "--production", "--frozen-lockfile"]

CMD ["yarn", "start:prod"]
