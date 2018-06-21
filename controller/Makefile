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
else
  CP=cp
  RM=rm -f
endif

include .env

VENDOR_IMAGE=b1f6c1c4/ansys-moe:controller
CFG_VENDOR=$(shell docker-machine config $(VENDOR_BUILD_MACHINE))
CFG_SRC=$(shell docker-machine config $(SRC_BUILD_MACHINE))

.PHONY: vendor src
.DEFAULT_GOAL := src

vendor: package.json yarn.lock
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
	yarn build
	$(CP) .dockerignore.src .dockerignore
	docker $(CFG_SRC) build \
		--tag ansys-controller \
		--file Dockerfile \
		.
	$(RM) .dockerignore
	$(RM) VERSION.json
