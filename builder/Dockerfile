FROM gcc:7

MAINTAINER b1f6c1c4, <b1f6c1c4@gmail.com>

RUN \
    apt-get update \
    && apt-get install -y cmake \
    && rm -rf /var/lib/apt/lists/*

RUN \
    curl -fsSL "https://downloads.sourceforge.net/project/boost/boost/1.66.0/boost_1_66_0.tar.bz2?r=https%3A%2F%2Fsourceforge.net%2Fprojects%2Fboost%2Ffiles%2Fboost%2F1.66.0%2F&ts=1515136452&use_mirror=phoenixnap" \
        -o boost_1_66_0.tar.bz2 \
    && tar --bzip2 -xf boost_1_66_0.tar.bz2 \
    && rm -f boost_1_66_0.tar.bz2 \
    && cd boost_1_66_0 \
    && ./bootstrap.sh --prefix=/usr/local

ENV LD_LIBRARY_PATH "$LD_LIBRARY_PATH:/usr/local/lib"

RUN \
    cd boost_1_66_0 \
    && ./b2 -q -a -sHAVE_ICU=1 -j 10 \
        --with-test \
        --with-chrono \
        --with-system \
        --with-program_options \
    && ./b2 -d0 -j 10 \
        --with-test \
        --with-chrono \
        --with-system \
        --with-program_options \
        install \
    && cd .. \
    && rm -rf boost_1_66_0

RUN \
    git clone --depth=1 "https://github.com/weidai11/cryptopp" \
    && cd cryptopp \
    && make -j 10 \
    && make -j 10 install \
    && cd .. \
    && rm -rf cryptopp

RUN \
    git clone --depth=1 "https://github.com/alanxz/rabbitmq-c" \
    && cd rabbitmq-c \
    && mkdir build && cd build \
    && cmake \
        -DCMAKE_INSTALL_PREFIX=/usr/local \
        -DCMAKE_INSTALL_LIBDIR=lib \
        -DBUILD_SHARED_LIBS=ON \
        -DBUILD_STATIC_LIBS=OFF \
        -DBUILD_TESTS=OFF \
        -DBUILD_TOOLS=OFF \
        -DBUILD_TOOLS_DOCS=OFF \
        -DENABLE_SSL_SUPPORT=OFF \
        -DBUILD_EXAMPLES=OFF \
        .. \
    && cmake --build . --target install -- -j 10 \
    && cd ../.. \
    && rm -rf rabbitmq-c

RUN \
    git clone --depth=1 "https://github.com/alanxz/SimpleAmqpClient" \
    && cd SimpleAmqpClient \
    && mkdir build && cd build \
    && cmake \
        -DCMAKE_INSTALL_PREFIX=/usr/local \
        -DENABLE_SSL_SUPPORT=OFF \
        .. \
    && cmake --build . --target install -- -j 10 \
    && cd ../.. \
    && rm -rf SimpleAmqpClient

RUN \
    curl -SL "https://raw.githubusercontent.com/nlohmann/json/master/single_include/nlohmann/json.hpp" \
        -o json.hpp \
    && mv json.hpp /usr/local/include

RUN \
    git clone --depth=1 "https://github.com/gabime/spdlog" \
    && cp -r spdlog/include/spdlog /usr/local/include \
    && rm -rf spdlog

RUN \
    apt-get update \
    && apt-get install -y gcovr \
    && rm -rf /var/lib/apt/lists/*
