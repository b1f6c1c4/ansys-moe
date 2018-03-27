FROM node:8-alpine

COPY . .

CMD ["yarn", "start"]

EXPOSE 3000
