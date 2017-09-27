es5/index.js: index.js
	mkdir -p es5
	./node_modules/.bin/buble $^ > $@
