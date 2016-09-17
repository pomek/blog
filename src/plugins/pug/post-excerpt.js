'use strict';

const cheerio = require('cheerio');

/**
 * @param {File} post Post from the excerpt will be extracted.
 * @returns {String}
 */
module.exports = (post) => {
    const $ = cheerio.load(post.contents);

    return $('p:first-child').html();
};
