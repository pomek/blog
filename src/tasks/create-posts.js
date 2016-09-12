'use strict';

const fs = require('fs-extra');
const path = require('path');
const pug = require('pug');
const File = require('../file');
const {tools} = require('../utils');

/**
 * @param {Object} config
 * @param {String[]} posts
 * @returns {Promise}
 */
module.exports = (config, posts) => {
    const templatePath = path.join(config.TEMPLATE_DIR, 'single-post.pug');
    const conventer = tools.getMarkdownConverter(config.MARKDOWN_PLUGINS);
    const promises = [];

    posts.slice()
        .map((post) => {
            let postFile = new File({
                contents: fs.readFileSync(post, 'utf-8'),
                basename: path.basename(post).replace(/md$/, 'html'),
                dirname: config.TEMPORARY_DIR
            });

            return conventer(postFile);
        })
        .forEach((post) => {
            post.contents = pug.renderFile(templatePath, {config, post});

            promises.push(tools.saveFile(post));
        });

    return Promise.all(promises);
};
