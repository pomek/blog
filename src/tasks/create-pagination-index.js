'use strict';

const path = require('path');
const pug = require('pug');
const {tools} = require('../utils');
const File = require('../file');

/**
 * @param {Object} config
 * @param {Function[]} config.MARKDOWN_PLUGINS Markdown plugins.
 * @param {String} config.TEMPLATE_DIR Path to the templates.
 * @param {String} config.TEMPORARY_DIR The output path.
 * @param {Number} config.POSTS_PER_PAGE Number of the posts on single page.
 * @param {String[]} posts Paths to the post files.
 * @returns {Promise}
 */
module.exports = (config, posts) => {
    if (!posts.length) {
        return Promise.reject('The posts collection is empty.');
    }

    const promises = [];

    // Prepare Markdown converter.
    const markdownConverter = tools.getMarkdownConverter(config.MARKDOWN_PLUGINS);

    // Prepare path to the template.
    const templatePath = path.join(config.TEMPLATE_DIR, 'index.pug');

    // Count the all available pages.
    const allPages = Math.ceil(posts.length / config.POSTS_PER_PAGE);

    for (let i = 1; i <= allPages; ++i) {
        // Compile the posts.
        const postsForPage = tools.compilePosts(
            posts.slice((i - 1) * config.POSTS_PER_PAGE, i * config.POSTS_PER_PAGE),
            markdownConverter,
            config.TEMPORARY_DIR
        );

        // Compile the template.
        const compiledFile = pug.renderFile(templatePath, {
            allPages,
            config,
            currentPage: i,
            posts: postsForPage
        });

        // Preapre the file.
        const indexFile = new File({
            dirname: path.join(config.TEMPORARY_DIR, getDirname(i)),
            basename: 'index.html',
            contents: compiledFile
        });

        // Save.
        promises.push(
            tools.saveFile(indexFile)
        );
    }

    return Promise.all(promises);
};

/**
 * @param {Number} page
 * @returns {String}
 */
function getDirname (page) {
    if (1 === page) {
        return '';
    }

    return page.toString();
}

