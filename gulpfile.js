'use strict';

const gulp = require('gulp');
const createPaginationIndex = require('./src/tasks/create-pagination-index');
const createPosts = require('./src/tasks/create-posts');
const {workspace} = require('./src/utils');

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
        require('./src/plugins/markdown/post-links')
    ]
};

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
