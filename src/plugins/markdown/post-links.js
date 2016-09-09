'use strict';

/**
 * Middleware replaces custom link syntax to Markdown.
 *
 * @param {Post} file
 * @param {Function} next
 */
module.exports = (file, next) => {
    return next(file);
};
