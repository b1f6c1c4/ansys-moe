# ansys-moe: Computer-automated Design System
# Copyright (C) 2018  Jinzheng Tu
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

.PHONY: vendor src python rlang local
.DEFAULT_GOAL := all

vendor:
	docker $(CFG_VENDOR) build \
		--tag $(VENDOR_IMAGE) \
		--file Dockerfile.vendor \
        - < Dockerfile.vendor
	docker $(CFG_VENDOR) login \
		-u $(DOCKER_USERNAME) -p $(DOCKER_PASSWORD)
	docker $(CFG_VENDOR) push \
		$(VENDOR_IMAGE)
	docker $(CFG_SRC) pull \
		$(VENDOR_IMAGE)

src:
	docker $(CFG_SRC) build \
		--tag ansys-commond \
        --build-arg VERSION=$(VERSION) \
        --build-arg COMMITHASH=$(COMMITHASH) \
        .

python: src
	docker $(CFG_SRC) build --tag ansys-commond-$@ Python

rlang: src
	docker $(CFG_SRC) build --tag ansys-commond-$@ R

std svc:
	$(RM) $(call FixPath, bin/commond-$@)
	go install \
		-ldflags "-X commond.VERSION=$(VERSION) -X commond.COMMITHASH=$(COMMITHASH)" \
		commond-$@

local: std svc

all: python rlang local

run: std
	$(call FixPath, bin/commond-std)

