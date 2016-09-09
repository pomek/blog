'use strict';

const yaml = require('js-yaml');

/**
 * Middlewares tries to separate the meta tags and the content.
 *
 * @param {Post} file
 * @param {Function} next
 */
module.exports = (file, next) => {
    const metaDataRegex = /~{3}\n([\s\S]+)~{3}([\s\S]+)?/;
    const content = file.contents.toString('utf-8');
    const matchedData = content.match(metaDataRegex);

    if (!matchedData) {
        throw new Error('Cannot find the meta data.');
    }

    const parsedYaml = yaml.safeLoad(matchedData[1]);

    for (const key of Object.keys(parsedYaml)) {
        file.setMetaTag(key, parsedYaml[key]);
    }

    const createdAt = file.relative.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1];

    file.contents = new Buffer(matchedData[2].trim());
    file.setMetaTag('created_at', createdAt);

    return next(file);
};
