CXX=g++
TARGETS=main rpc ring ringImpl
DEPS=common.h $(addsuffix .h, $(TARGETS))
LIBS=-lboost_program_options -lrabbitmq -lSimpleAmqpClient -lcryptopp
LIBSP=$(LIBS)
LIBST=$(LIBS)
CFLAGS=-std=c++17 -Wall -pthread -DVERSION=\"$$(git describe --always)\" -DCOMMITHASH=\"$$(git rev-parse HEAD)\"
CFLAGSP=$(CFLAGS) -O3
CFLAGST=$(CFLAGS) -DIS_TEST -g --coverage

-include $(patsubst %, build/%.o.d, $(TARGETS))

build/%.o: %.cpp
	mkdir -p build
	$(CXX) -c -o $@ $< -MMD -MT $@ -MF $@.d $(CFLAGSP)

build/cryptor: $(patsubst %, build/%.o, $(TARGETS))
	mkdir -p build
	$(CXX) -o $@ $^ $(CFLAGSP) $(LIBSP)

-include $(patsubst %, build/tests/%.d, $(TARGETS))

build/tests/%: tests/%.test.cpp %.cpp tests/common.test.h
	mkdir -p build/tests
	$(CXX) -o $@ $< $*.cpp $(CFLAGST) -MMD -MT $@ -MF $@.d $(LIBST) -lboost_unit_test_framework

.PRECIOUS: $(addprefix build/tests/, $(TARGETS))

.DEFAULT: all

.PHONY: all test clean

all: build/cryptor

test: clean-cov $(addprefix run-, $(TARGETS))
	gcovr -r . --exclude="\.h(pp)?$$" --exclude="^tests/" -s

run-%: build/tests/%
	-./$< --color_output --log_format=CLF --log_level=message --log_sink=stdout --report_format=CLF --report_level=short --report_sink=stdout

ci-test: clean-cov $(addprefix ci-run-, $(TARGETS))
	gcovr -r . --exclude="\.h(pp)?$$" --exclude="^tests/" -s --keep

ci-run-%: build/tests/%
	./$< --color_output --log_format=CLF --log_level=all --log_sink=stdout --report_format=CLF --report_level=short --report_sink=stdout

clean: clean-coverage
	rm -rf build

clean-cov:
	rm -f *.gcda *.gcov

clean-coverage: clean-cov
	rm -f *.gcno
