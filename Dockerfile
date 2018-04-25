FROM b1f6c1c4/builder:moed as builder

ARG VERSION
ARG COMMITHASH

WORKDIR /root/moed

COPY . .

RUN make all
RUN ./cpld.bash build/moed build

FROM debian:stretch

WORKDIR /root/moed

COPY --from=builder /root/moed/build .

ENV LD_LIBRARY_PATH .

CMD ["./moed"]
