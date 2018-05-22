FROM ansys-commond as built

FROM python:3.6-jessie

RUN pip install numpy scipy json-tricks

RUN \
        mkdir -p /opt \
        && cd /opt \
        && git clone --depth=1 https://github.com/sahilm89/lhsmdu \
        && cd lhsmdu \
        && python setup.py install

WORKDIR /root/
COPY --from=built /go/bin/commond-std .
COPY . ./Python
ENV PYTHONPATH=/root/Python
CMD ["./commond-std"]
