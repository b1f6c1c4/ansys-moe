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
