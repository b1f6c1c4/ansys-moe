FROM ansys-frontend AS frontend

FROM nginx

RUN \
      unlink /var/log/nginx/access.log \
      && unlink /var/log/nginx/error.log

COPY default.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend / /var/www
