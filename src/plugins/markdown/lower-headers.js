'use strict';

const cheerio = require('cheerio');

/**
 * Middlewares lowers priority of the headers.
 *
 * @param {File} file
 * @param {Function} next
 */
module.exports = (file, next) => {
    const result = next(file);
    const $ = cheerio.load(file.contents);

    $('h1, h2, h3, h4').each((index, element) => {
        const priority = parseInt(element.name.substring(1));

        element.name = `h${ ( priority + 2 ) }`;
    });

    file.contents = $.html();

    return result;
};
