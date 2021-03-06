APP=locustempus
JS_FILES=media/src/js media/src/project

all: jenkins mypy js-typecheck cypress-test
.PHONY: all

include *.mk

ifeq ($(TRAVIS),true)
	MYPY ?= mypy
else
	MYPY ?= $(VE)/bin/mypy
endif

test-travis:
	$(MANAGE) test --settings=$(APP).settings_travis --noinput
.PHONY: test-travis 

travis: check flake8 test-travis eslint bandit mypy js-typecheck cypress-test-travis
.PHONY: travis 

mypy: $(PY_SENTINAL)
	$(MYPY)
.PHONY: mypy

integrationserver: check
	$(MANAGE) integrationserver --addrport $(INTERFACE):$(RUNSERVER_PORT) --noinput
.PHONY: integrationserver 

integrationserver-travis: check
	$(MANAGE) integrationserver --addrport $(INTERFACE):$(RUNSERVER_PORT) --noinput --settings=$(APP).settings_travis
.PHONY: integrationserver-travis

webpack: $(JS_SENTINAL)
	npm run dev
.PHONY: webpack

js-typecheck: $(JS_SENTINAL)
	npm run typecheck
.PHONY: js-typecheck

js-build: $(JS_SENTINAL)
	rm -rf media/build/*
	npm run build
.PHONY: js-build

cypress-run: $(JS_SENTINAL)
	npm run cypress:run
.PHONY: cypress-run

cypress-open: $(JS_SENTINAL)
	npm run cypress:open
.PHONY: cypress-open

cypress-test: js-build
	npm run cypress:test
.PHONY: cypress-test

cypress-test-travis: js-build
	npm run cypress:test-travis
.PHONY: cypress-test-travis

cypress-watch: $(JS_SENTINAL)
	npm run cypress:watch 
.PHONY: cypress-watch

dev:
	trap 'kill 0' EXIT; make runserver & make webpack
.PHONY: dev

cypress:
	trap 'kill 0' EXIT; make integrationserver & make webpack & make cypress-open
.PHONY: cypress
