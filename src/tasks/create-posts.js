'use strict';

const path = require('path');
const pug = require('pug');
const dateMapper = require('../plugins/pug/date-mapper');
const postExcerpt = require('../plugins/pug/post-excerpt');
const {tools} = require('../utils');

/**
 * @param {Object} config
 * @param {Function[]} config.MARKDOWN_PLUGINS Markdown plugins.
 * @param {String} config.TEMPLATE_DIR Path to the templates.
 * @param {String} config.TEMPORARY_DIR The output path.
 * @param {String[]} posts Paths to the post files.
 * @returns {Promise}
 */
module.exports = (config, posts) => {
    const promises = [];

    // Prepare Markdown converter.
    const markdownConverter = tools.getMarkdownConverter(config.MARKDOWN_PLUGINS);

    // Prepare path to the template.
    const templatePath = path.join(config.TEMPLATE_DIR, 'post.pug');

    // Compile the posts...
    tools.compilePosts(posts.slice(), markdownConverter, config.TEMPORARY_DIR)
        .forEach((post) => {
            // And wrap them in the template.
            post.contents = pug.renderFile(templatePath, {
                config,
                file: post,
                pretty: true,
                utils: {
                    path: path.join.bind(path),
                    date: dateMapper,
                    excerpt: postExcerpt
                }
            });

            promises.push(tools.saveFile(post));
        });

    return Promise.all(promises);
};
