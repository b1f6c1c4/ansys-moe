FROM ansys-controller-vendor

WORKDIR /usr/src/ansys-controller
COPY . .

CMD ["yarn", "start:prod"]
