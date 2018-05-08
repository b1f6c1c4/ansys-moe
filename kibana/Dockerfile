FROM docker.elastic.co/kibana/kibana-oss:6.2.4

RUN ./bin/kibana-plugin install 'https://git.bitsensor.io/front-end/elastalert-kibana-plugin/builds/artifacts/6.2.4/raw/artifact/elastalert-kibana-plugin-latest.zip?job=build'

USER root

RUN \
        echo 'elastalert.serverHost: elastalert' >> config/kibana.yml \
        && echo 'elastalert.serverPort: 3030' >> config/kibana.yml

USER kibana
