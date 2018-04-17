vendor:
	yarn install --production --frozen-lockfile
	cp .dockerignore.vendor .dockerignore
	docker build \
		--tag ansys-controller-vendor \
		--file Dockerfile.vendor \
		.

src:
	cp .dockerignore.src .dockerignore
	docker build \
		--tag ansys-controller \
		--file Dockerfile \
		.
