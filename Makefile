build:
	bundle install
	make bower
	jekyll build

bower:
	node ./node_modules/bower/bin/bower install

serve:
	jekyll serve
