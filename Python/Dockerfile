FROM ansys-commond as built

FROM alectolytic/scipy:latest
RUN apk --update add git
RUN \
        mkdir -p /opt \
        && cd /opt \
        && git clone --depth=1 https://github.com/sahilm89/lhsmdu \
        && cd lhsmdu \
        && python setup.py install

RUN pip install json-tricks

WORKDIR /root/
COPY --from=built /go/bin/commond-std .
COPY . ./Python
CMD ["./commond-std"]
