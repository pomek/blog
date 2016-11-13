'use strict';

const cheerio = require('cheerio');

/**
 * Middlewares tries to find excerpt for post.
 *
 * @param {File} file Post from the excerpt will be extracted.
 * @param {Function} next
 */
module.exports = (file, next) => {
    file = next(file);

    const $ = cheerio.load(file.contents);
    const $firstChild = $('p').first();

    file.setMetaTag('excerpt', $firstChild.html());

    // Remove the first paragraph and the horizontal rule.
    $firstChild.remove();
    $('hr').first().remove();

    file.contents = $.html();

    return file;
};
