FROM golang:alpine as builder
COPY . /go
RUN go install commond-std

FROM r-base:latest
RUN Rscript -e "install.packages('jsonlite')"
WORKDIR /root/
COPY --from=builder /go/bin/* .
CMD ["./commond-std"]
