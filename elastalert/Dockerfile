FROM python:2.7

ENV VERSION=0.1.30

RUN \
      curl -fsSL "https://github.com/Yelp/elastalert/archive/v${VERSION}.tar.gz" \
      -o elastalert.tar.gz \
      && tar xvf elastalert.tar.gz \
      && rm elastalert.tar.gz \
      && mv elastalert-${VERSION} /opt/elastalert

WORKDIR /opt/elastalert

RUN pip install -r requirements-dev.txt

RUN python setup.py install

COPY --chown=root:root entrypoint.sh /opt
RUN chmod 777 /opt/entrypoint.sh

COPY config.yaml .

CMD ["/opt/entrypoint.sh"]
