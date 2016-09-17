'use strict';

/**
 * Middleware replaces custom link syntax to Markdown.
 *
 * @param {File} file
 * @param {Function} next
 */
module.exports = (file, next) => {
    // Extract the file name from the link.
    const linkRegexp = /`@post ([A-Z-0-9]+\.html)`/gi;

    // Checks nesting level of current file.
    const levelsToRoot = file.dirname.split('/').length;
    const prefix = (levelsToRoot > 1) ? '../'.repeat(levelsToRoot) : './';

    // Replaces custom syntax to the Markdown.
    file.contents = file.contents.replace(linkRegexp, (matched, file) => prefix + file);

    return next(file);
};
