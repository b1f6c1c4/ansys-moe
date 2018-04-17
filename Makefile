include .env

vendor:
	cp .dockerignore.vendor .dockerignore
	docker $$(docker-machine config $(VENDOR_BUILD_MACHINE)) build \
		--tag b1f6c1c4/ansys-controller-vendor \
		--file Dockerfile.vendor \
		.
	docker $$(docker-machine config $(VENDOR_BUILD_MACHINE)) login \
		-u $(DOCKER_USERNAME) -p $(DOCKER_PASSWORD)
	docker $$(docker-machine config $(VENDOR_BUILD_MACHINE)) push \
		b1f6c1c4/ansys-controller-vendor
	docker $$(docker-machine config $(SRC_BUILD_MACHINE)) pull \
		b1f6c1c4/ansys-controller-vendor

src:
	cp .dockerignore.src .dockerignore
	docker $$(docker-machine config $(SRC_BUILD_MACHINE)) build \
		--tag ansys-controller \
		--file Dockerfile \
		.
