FROM b1f6c1c4/ansys-moe:facade

WORKDIR /usr/src/ansys-facade
COPY . .

CMD ["yarn", "start:prod"]

EXPOSE 3000
