FROM node:8-alpine

COPY . .

CMD ["yarn", "start"]

EXPOSE 64381 64382
