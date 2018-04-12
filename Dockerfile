FROM golang:alpine as builder
COPY . /go
RUN go install commond-std

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /go/bin/* .
CMD ["./commond-std"]
