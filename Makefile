ifeq ($(OS),Windows_NT)
  CP=copy
  RM=del /Q
  FixPath = $(subst /,\,$1).exe
else
  CP=cp
  RM=rm -f
  FixPath = $1
endif

VERSION=$(shell git describe --always)
COMMITHASH=$(shell git rev-parse HEAD)
include .env

VENDOR_IMAGE=b1f6c1c4/ansys-moe:commond
CFG_VENDOR=$(shell docker-machine config $(VENDOR_BUILD_MACHINE))
CFG_SRC=$(shell docker-machine config $(SRC_BUILD_MACHINE))

.PHONY: vendor src local
.DEFAULT_GOAL := all

vendor:
	$(CP) .dockerignore.vendor .dockerignore
	docker $(CFG_VENDOR) build \
		--tag $(VENDOR_IMAGE) \
		--file Dockerfile.vendor \
        .
	$(RM) .dockerignore
	docker $(CFG_VENDOR) login \
		-u $(DOCKER_USERNAME) -p $(DOCKER_PASSWORD)
	docker $(CFG_VENDOR) push \
		$(VENDOR_IMAGE)
	docker $(CFG_SRC) pull \
		$(VENDOR_IMAGE)

src:
	$(CP) .dockerignore.src .dockerignore
	docker $(CFG_SRC) build \
		--tag ansys-commond \
		--file Dockerfile \
        --build-arg VERSION=$(VERSION) \
        --build-arg COMMITHASH=$(COMMITHASH) \
        .
	$(RM) .dockerignore

std svc:
	$(RM) $(call FixPath, bin/commond-$@)
	go install \
		-ldflags "-X commond.VERSION=$(VERSION) -X commond.COMMITHASH=$(COMMITHASH)" \
		commond-$@

local: std svc

all: src local

run: std
	$(call FixPath, bin/commond-std)

