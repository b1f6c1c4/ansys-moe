ifndef VERSION
  VERSION=$(shell git describe --always)
endif
ifndef COMMITHASH
  COMMITHASH=$(shell git rev-parse HEAD)
endif
CXX=g++
TARGETS=main moe
DEPS=common.h $(addsuffix .h, $(TARGETS))
LIBS=-lboost_program_options -lgomp \
     /usr/local/lib/python2.7/dist-packages/moe/build/GPP.so
CFLAGS=-std=c++17 -Wall -pthread -DVERSION=\"$(VERSION)\" -DCOMMITHASH=\"$(COMMITHASH)\" -O3 \
       -I/usr/local/lib/python2.7/dist-packages/moe/optimal_learning/cpp

-include $(patsubst %, build/%.o.d, $(TARGETS))

build/%.o: %.cpp
	mkdir -p build
	$(CXX) -c -o $@ $< -MMD -MT $@ -MF $@.d $(CFLAGS)

build/moed: $(patsubst %, build/%.o, $(TARGETS))
	mkdir -p build
	$(CXX) -o $@ $^ $(CFLAGS) $(LIBS)

.DEFAULT: all

.PHONY: all clean docker

all: build/moed

clean:
	rm -rf build

docker:
	docker build -t ansys-moed --build-arg VERSION=$(VERSION) --build-arg COMMITHASH=$(COMMITHASH) .
