FROM node:8-alpine

COPY . .

CMD ["yarn", "start:prod"]

EXPOSE 3000
