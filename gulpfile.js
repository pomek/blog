'use strict';

const path = require('path');
const gulp = require('gulp');

// Gulp plugins.
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const copy = require('gulp-copy');
const rollup = require('gulp-rollup');
const babel = require('rollup-plugin-babel');
const browserSync = require('browser-sync');

// Tasks & helpers.
const createPaginationIndex = require('./src/tasks/create-pagination-index');
const createPosts = require('./src/tasks/create-posts');
const workspace = require('./src/utils/workspace');
const tools = require('./src/utils/tools.js');

const config = {
    // Path where parsed files will be saved.
    TEMPORARY_DIR: '.tmp',

    // Path to the posts.
    POSTS_DIR: 'posts',

    // Path to the templates.
    TEMPLATE_DIR: 'template',

    // Number of posts displayed on single page.
    POSTS_PER_PAGE: 4,

    // Plugins used to convert Markdown to HTML.
    MARKDOWN_PLUGINS: [
        require('./src/plugins/markdown/meta-data'),
        require('./src/plugins/markdown/post-links'),
        require('./src/plugins/markdown/lower-headers'),
        require('./src/plugins/markdown/post-excerpt'),
    ],

    // The assets configuration.
    ASSETS: {
        // Path to the stylesheets.
        STYLES: 'assets/styles',

        // Path to the scripts.
        SCRIPTS: 'assets/scripts',

        // Path to the fonts.
        FONTS: 'assets/fonts'
    }
};

// Read arguments from CLI.
const argv = tools.parseArguments();

// An instance of Browser-sync.
const server = browserSync.create();

gulp.task('posts', () => {
    return workspace.getPosts('./posts')
        .then((posts) => {
            return createPosts(config, posts);
        });
});

gulp.task('index', () => {
    return workspace.getPosts('./posts')
        .then((posts) => {
            return workspace.orderPostsByDate(posts);
        })
        .then((posts) => {
            return createPaginationIndex(config, posts);
        });
});

gulp.task('styles', () => {
    return gulp.src(`${config.ASSETS.STYLES}/style.scss`)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(path.join(config.TEMPORARY_DIR, config.ASSETS.STYLES)));
});

gulp.task('copy', () => {
    return gulp.src(`${config.ASSETS.FONTS}/*`)
        .pipe(copy(config.TEMPORARY_DIR));
});

gulp.task('scripts', () => {
    return gulp.src(`${config.ASSETS.SCRIPTS}/**/*.js`)
        .pipe(rollup({
            format: 'umd',
            entry: [
                path.join(config.ASSETS.SCRIPTS, 'index.js'),
                path.join(config.ASSETS.SCRIPTS, 'post.js')
            ],
            plugins: [
                babel({
                    exclude: 'node_modules/**'
                })
            ]
        }))
        .pipe(gulp.dest(path.join(config.TEMPORARY_DIR, config.ASSETS.SCRIPTS)));
});

gulp.task('server', ['build'], () => {
    server.init({
        server: config.TEMPORARY_DIR,
        open: argv.browser ? 'local' : false
    });

    // Watchers for Gulp.
    gulp.watch(`${config.ASSETS.STYLES}/**/*.scss`, ['styles']);
    gulp.watch(`${config.ASSETS.SCRIPTS}/**/*.js`, ['scripts']);
    gulp.watch(`${config.TEMPLATE_DIR}/index.pug`, ['index']);
    gulp.watch(`${config.TEMPLATE_DIR}/post.pug`, ['posts']);
    gulp.watch(`${config.TEMPLATE_DIR}/layout/*.pug`, ['index', 'posts']);
    gulp.watch(`${config.TEMPLATE_DIR}/includes/*.pug`, ['index', 'posts']);

    // Reload browsers after changes.
    server.watch(`${config.TEMPORARY_DIR}/**/*.css`).on('change', server.reload);
    server.watch(`${config.TEMPORARY_DIR}/**/*.js`).on('change', server.reload);
    server.watch(`${config.TEMPORARY_DIR}/**/*.html`).on('change', server.reload);
});

gulp.task('build', ['posts', 'index', 'styles', 'copy', 'scripts']);
