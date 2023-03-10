DEPS=$(wildcard src/*.js src/*.ts ./asserts/userscript_header.txt ./package.json ./package-lock.json ./tsconfig.json ./webpack.config.js)

.DEFAULT_TARGET: all

all: build-dev

.phony: clean
clean:
	rm -f ./dist/*.js
	rm -fr ./build/

.phony: distclean
distclean: clean
	rm -r ./node_modules

.phony: node-modules
node-modules:
	npm install --ignore-scripts

build-dev: dist/duchinese-helper.userscript.js

build-prod: dist/duchinese-helper.min.userscript.js

dist/duchinese-helper.userscript.js: node-modules $(DEPS)
	npm run compile
	cat assets/userscript_header.txt dist/bundle.js > $@

dist/duchinese-helper.min.userscript.js: node-modules $(DEPS)
	npm run compile-prod
	cat assets/userscript_header.txt dist/bundle.js > $@
