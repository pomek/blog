'use strict';

const yaml = require('js-yaml');

/**
 * Middlewares tries to separate the meta tags and the content.
 *
 * @param {File} file
 * @param {Function} next
 */
module.exports = (file, next) => {
    const metaDataRegex = /~{3}\n([\s\S]+)~{3}([\s\S]+)?/;
    const matchedData = file.contents.match(metaDataRegex);

    if (!matchedData) {
        throw new Error('Cannot find the meta data.');
    }

    const parsedYaml = yaml.safeLoad(matchedData[1].trim());

    for (const key of Object.keys(parsedYaml)) {
        file.setMetaTag(key, parsedYaml[key]);
    }

    file.contents = matchedData[2].trim();

    return next(file);
};
