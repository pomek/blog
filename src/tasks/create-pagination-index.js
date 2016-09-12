'use strict';

const fs = require('fs-extra');
const pug = require('pug');
const path = require('path');
const merge = require('merge-stream');
const transformToHtml = require('../plugins/transform-to-html');
const {workspace, stream, tools} = require('../utils');
const File = require('../file');

/**
 * @param {Object} config
 * @param {String[]} posts
 * @returns {Promise}
 */
module.exports = (config, posts) => {
    if (!posts.length) {
        return Promise.reject('The posts collection is empty.');
    }

    const templatePath = path.join(config.TEMPLATE_DIR, 'index.pug');
    const allPages = Math.ceil(posts.length / config.POSTS_PER_PAGE);
    const promises = [];

    for (let i = 1; i <= allPages; ++i) {
        const postsForPage = compilePosts(
            posts.slice((i - 1) * config.POSTS_PER_PAGE, i * config.POSTS_PER_PAGE)
        );
        const compiledFile = pug.renderFile(templatePath, {
            allPages,
            config,
            currentPage: i,
            posts: postsForPage
        });

        let dirname = config.TEMPORARY_DIR;

        if (i > 1) {
            dirname += path.sep + i.toString();
        }

        const indexFile = new File({
            dirname,
            basename: 'index.html',
            contents: compiledFile
        });

        promises.push(tools.saveFile(indexFile));
    }

    return Promise.all(promises);

    /**
     * Compiles posts to HTML.
     *
     * @param {String[]} posts Paths to the posts.
     * @param {Number} currentPage Current page.
     * @returns {File[]}
     */
    function compilePosts (posts) {
        const conventer = tools.getMarkdownConverter(config.MARKDOWN_PLUGINS);

        return posts.slice()
            .map((post) => {
                let postFile = new File({
                    contents: fs.readFileSync(post, 'utf-8'),
                    basename: path.basename(post).replace(/md$/, 'html'),
                    dirname: config.TEMPORARY_DIR
                });

                return conventer(postFile);
            });
    }
};
