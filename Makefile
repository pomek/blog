bower:
	node ./node_modules/bower/bin/bower install

build:
	make bower
	jekyll build

serve:
	jekyll serve
