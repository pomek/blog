'use strict';

const path = require('path');
const gulp = require('gulp');
const transformToHtml = require('./src/plugins/transform-to-html');
const {stream} = require('./src/utils');

gulp.task('posts', () => {
    const globPath = './posts/*.md';

    return gulp.src(globPath, {base: path.dirname(globPath).dir})
        .pipe(transformToHtml([
            require('./src/plugins/markdown/meta-data'),
            require('./src/plugins/markdown/post-links')
        ]))
        .pipe(stream.renamePosts())
        .pipe(gulp.dest('.tmp'));
});
