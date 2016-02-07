prepare:
	npm install --production
	./node_modules/bower/bin/bower install --production
	./node_modules/grunt-cli/bin/grunt prepare

build:
	JEKYLL_ENV=production jekyll build
	./node_modules/grunt-cli/bin/grunt compress

full-build:
	make prepare
	make build
	./node_modules/grunt-cli/bin/grunt clean
