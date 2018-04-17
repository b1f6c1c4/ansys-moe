ifeq ($(OS),Windows_NT)
  CP=copy
  RM=del /Q
else
  CP=cp
  RM=rm -f
endif

VENDOR_IMAGE=ansys-monitor-vendor

.PHONY: vendor src
.DEFAULT_GOAL := src

vendor: package.json yarn.lock
	$(CP) .dockerignore.vendor .dockerignore
	docker build \
		--tag $(VENDOR_IMAGE) \
		--file Dockerfile.vendor \
		.
	$(RM) .dockerignore

src:
	yarn build
	$(CP) .dockerignore.src .dockerignore
	docker build \
		--tag ansys-monitor \
		--file Dockerfile \
		.
	$(RM) .dockerignore
	$(RM) VERSION.json
