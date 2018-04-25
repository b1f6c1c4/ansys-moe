FROM debian:stretch

WORKDIR /root/cryptor

COPY build .

ENV LD_LIBRARY_PATH .

CMD ["./cryptor"]
