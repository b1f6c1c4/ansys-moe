FROM docker.elastic.co/beats/filebeat:6.2.4

USER root

RUN rm -rf modules.d prospectors.d

COPY . .

USER filebeat
