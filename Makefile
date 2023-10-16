PROJECTDIR:=$(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
MAKEFILEDIR:=$(PROJECTDIR)/makefiles

ENV?=dev
PEANUT_E_TYPE?=web
HTTPS?=off
PEANUT_APP_SRC_PATH?=$(PROJECTDIR)/src
PEANUT_DIR_ENT_SRC_PATH?=/src

ifeq ($(MAKECMDGOALS),develop)
	PEANUT_DIST?=develop
else ifeq ($(MAKECMDGOALS),export-component)
	PEANUT_DIST?=export
else
	PEANUT_DIST?=serve
endif

ifeq ($(ENV),prod)
	DEV_ENV=ENVIRONMENT="dev" PORT="5000" NODE_ENV="production" CONTENT_HUB_ENV="$(CONTENT_HUB_ENV)" PEANUT_DIST="$(PEANUT_DIST)"
else
	DEV_ENV=ENVIRONMENT="local" PORT="5000" NODE_ENV="development" CONTENT_HUB_ENV="$(CONTENT_HUB_ENV)" PEANUT_DEBUG="true" PEANUT_DIST="$(PEANUT_DIST)"
endif

ifeq ($(HTTPS),yes)
  HTTPS_ENV=ENABLE_HTTPS=true HTTPS_PORT="5443"
endif


TFDIR:=$(PROJECTDIR)/iac
TFENV?=dev

TFVARFILE=${TFENV}.tfvars

.PHONY: install
install: install-app husky-prepare

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
		rm -rf ./dist/$(PEANUT_DIST)/*;

.PHONY: make-dist
make-dist:
	@mkdir -p ./dist/$(PEANUT_DIST);

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
		$(DEV_ENV) $(HTTPS_ENV) PEANUT_APP_SRC_PATH="$(PEANUT_APP_SRC_PATH)" PEANUT_DIR_ENT_SRC_PATH="$(PEANUT_DIR_ENT_SRC_PATH)" node ./develop.js;

.PHONY: build-%
build-%: make-dist clean-dist
	@echo 'Building $*...'; \
		$(DEV_ENV) PEANUT_BUILD="$*" node ./build.js

.PHONY: build
build: build-stack

.PHONY: serve
serve:
	$(DEV_ENV) $(HTTPS_ENV) node ./serve.js;

.PHONY: export-component
export-component: build-stack
	@echo 'Exporting entries [$(PEANUT_DIR_ENTS)]...'; \
		$(DEV_ENV) $(AWS_ENV) PEANUT_DIR_ENTS="$(PEANUT_DIR_ENTS)" PEANUT_E_TYPE="$(PEANUT_E_TYPE)" node ./export.js

.PHONY: format-staged
format-staged:
	@echo 'Running pretty-quick...'; \
		node node_modules/pretty-quick/bin/pretty-quick.js --staged --pattern "**/*.+(js|json|md)";

.PHONY: format
format:
	@echo 'Running prettier...'; \
		node node_modules/prettier/bin/prettier.cjs --write "**/*.+(js|json|md)";

.PHONY: husky-prepare
husky-prepare:
	@echo 'Setting up husky...'; \
		node node_modules/husky/lib/bin.js install build/husky || true;

.PHONY: generate-component
generate-component:
	@node_modules/plop/bin/plop.js --plopfile=./build/plop/plopfile.js --dest=./src/components/

.PHONY: test
test:
	@echo 'Running jest...'; \
		node node_modules/jest/bin/jest.js --config=./test/jest.config.js;
