prepare:
	npm install --production
	./node_modules/bower/bin/bower install --production
	./node_modules/grunt-cli/bin/grunt prepare

build:
	JEKYLL_ENV=production jekyll build --incremental
	./node_modules/grunt-cli/bin/grunt compress
