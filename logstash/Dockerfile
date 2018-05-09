FROM docker.elastic.co/logstash/logstash-oss:6.2.4

RUN bin/logstash-plugin install logstash-filter-json_encode

RUN rm -rf ./pipeline
COPY . ./pipeline

EXPOSE 5044 5044/udp 12201/udp
