PROJECTDIR:=$(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
MAKEFILEDIR:=$(PROJECTDIR)/makefiles

ENV?=local
PFWP_EXPORT_TYPE?=web
HTTPS?=off
PFWP_APP_SRC_PATH?=$(PROJECTDIR)/src
PFWP_DIR_ENT_SRC_PATH?=/src

ifeq ($(MAKECMDGOALS),develop)
	PFWP_DIST?=develop
else ifeq ($(MAKECMDGOALS),export-component)
	PFWP_DIST?=export
else
	PFWP_DIST?=serve
endif

ifeq ($(ENV),prod)
	DEV_ENV=ENVIRONMENT="prod" PORT="5000" NODE_ENV="production" PFWP_DIST="$(PFWP_DIST)"
else
	DEV_ENV=ENVIRONMENT="$(ENV)" PORT="5000" NODE_ENV="development" PFWP_DEBUG="true" PFWP_DIST="$(PFWP_DIST)"
endif

ifeq ($(HTTPS),yes)
  HTTPS_ENV=ENABLE_HTTPS=true HTTPS_PORT="5443"
endif


TFDIR:=$(PROJECTDIR)/iac
TFENV?=dev

TFVARFILE=${TFENV}.tfvars

.PHONY: install
install: install-app

.PHONY: clean-install
clean-install: clean install

.PHONY: clean
clean:
	@echo 'Cleaning directories and files...'; \
		rm -rf ./dist; \
		rm -rf ./node_modules; \
		rm -f ./package-lock.json;

.PHONY: clean-dist
clean-dist:
	@echo 'Cleaning dist folder...'; \
		rm -rf ./dist/$(PFWP_DIST)/*;

.PHONY: make-dist
make-dist:
	@mkdir -p ./dist/$(PFWP_DIST);

.PHONY: install-app
install-app:
	@echo 'Running npm install...'; \
		NODE_ENV="development" npm install; \
		if [ -f ./extend/package.json ]; then \
			echo 'Extended npm packages found. Installing...'; \
			NODE_ENV="development" npm install ./extend; \
		fi

.PHONY: develop
develop: make-dist
	@echo 'Starting app in development mode...'; \
		$(DEV_ENV) $(HTTPS_ENV) PFWP_APP_SRC_PATH="$(PFWP_APP_SRC_PATH)" PFWP_DIR_ENT_SRC_PATH="$(PFWP_DIR_ENT_SRC_PATH)" node ./develop.js;

.PHONY: build-%
build-%: make-dist clean-dist
	@echo 'Building $*...'; \
		$(DEV_ENV) PFWP_BUILD="$*" node ./build.js

.PHONY: build
build: build-stack

.PHONY: serve
serve:
	$(DEV_ENV) $(HTTPS_ENV) node ./serve.js;

.PHONY: export-component
export-component: build-stack
	@echo 'Exporting entries [$(PFWP_DIRECTORY_ENTRIES)]...'; \
		$(DEV_ENV) $(AWS_ENV) PFWP_DIRECTORY_ENTRIES="$(PFWP_DIRECTORY_ENTRIES)" PFWP_EXPORT_TYPE="$(PFWP_EXPORT_TYPE)" node ./export.js

.PHONY: format
format:
	@echo 'Running prettier...'; \
		node node_modules/prettier/bin/prettier.cjs --write "**/*.+(js|json|md)";

.PHONY: generate-component
generate-component:
	@node_modules/plop/bin/plop.js --plopfile=./build/plop/plopfile.js --dest=./src/components/

.PHONY: test
test:
	@echo 'Running jest...'; \
		node node_modules/jest/bin/jest.js --config=./test/jest.config.js;
