FROM ansys-commond as built

FROM r-base:latest
RUN Rscript -e "install.packages('jsonlite')"
RUN Rscript -e "install.packages('randtoolbox')"
RUN Rscript -e "install.packages('GPfit')"
RUN Rscript -e "install.packages('CEoptim')"
WORKDIR /root/
COPY --from=built /go/bin/commond-std .
COPY . ./R
CMD ["./commond-std"]
