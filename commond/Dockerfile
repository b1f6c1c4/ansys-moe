FROM b1f6c1c4/ansys-moe:commond as builder
ARG VERSION
ARG COMMITHASH
COPY src /go/src
RUN go install \
        -ldflags "-X commond.VERSION=$VERSION -X commond.COMMITHASH=$COMMITHASH" \
        commond-std
