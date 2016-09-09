'use strict';

const commonmark = require('commonmark');
const Post = require('../post');
const {stream} = require('../utils');

/**
 * Transforms Markdown files to HTML files.
 *
 * @returns {Stream}
 */
module.exports = (middlewares = []) => {
    const conventer = buildMarkdownConverter(middlewares);

    return stream.loop((file) => {
        file = conventer(new Post(file));

        return file;
    });
};

/**
 * Combines functions in one.
 *
 * @param {Function[]} middlewares Functions to merge.
 * @returns {Function}
 */
function buildMarkdownConverter (middlewares) {
    const reader = new commonmark.Parser();
    const writer = new commonmark.HtmlRenderer();

    return middlewares.reduce(
        (next, current) => (file) => current(file, next),
        (file) => {
            const parsedMarkdown = writer.render(
                reader.parse(file.contents.toString('utf-8'))
            );

            file.contents = new Buffer(parsedMarkdown);

            return file;
        }
    );
}
