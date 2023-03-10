DEPS=$(wildcard src/*.js src/*.ts ./asserts/userscript_header.txt ./package.json ./package-lock.json ./tsconfig.json ./webpack.config.js)
VERSION=$(shell ( ( git describe --exact-match --tags || ( git symbolic-ref --short HEAD  && git log --date=format:%y%m%d_%H%M --pretty=format:%h_%cd -1 ) || echo -n UNKNOWN ) | tr '\n' '-' ) 2>/dev/null )

.DEFAULT_TARGET: all

all: build-dev

.PHONY: clean
clean:
	rm -f ./dist/*.js
	rm -fr ./build/

.PHONY: distclean
distclean: clean
	rm -r ./node_modules

.PHONY: node-modules
node-modules:
	npm install --ignore-scripts

build-dev: dist/duchinese-helper.userscript.js

build-prod: dist/duchinese-helper.min.userscript.js

.PHONY: dist/header.txt
dist/header.txt:
	@sed 's@UNKNOWNVERSION@$(VERSION)@' < assets/userscript_header.txt > dist/header.txt

dist/duchinese-helper.userscript.js: node-modules dist/header.txt $(DEPS)
	npm run compile
	cat dist/header.txt dist/bundle.js > $@

dist/duchinese-helper.min.userscript.js: node-modules dist/header.txt $(DEPS)
	npm run compile-prod
	cat dist/header.txt dist/bundle.js > $@
