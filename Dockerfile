FROM golang:alpine

COPY . /go
RUN go install commond-std

CMD ["/app/bin/commond-std"]
