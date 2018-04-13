FROM golang:latest as builder
COPY src /go/src
RUN go install commond-std

FROM r-base:latest
RUN Rscript -e "install.packages('jsonlite')"
WORKDIR /root/
COPY --from=builder /go/bin/* .
CMD ["./commond-std"]
