FROM ansys-facade-vendor

WORKDIR /usr/src/ansys-facade
COPY . .

CMD ["yarn", "start:prod"]

EXPOSE 3000
