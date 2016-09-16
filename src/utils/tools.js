'use strict';

const fs = require('fs-extra');
const path = require('path');
const commonmark = require('commonmark');
const File = require('../file');

const utils = {
    /**
     * Combines functions in one.
     *
     * @param {Function[]} middlewares Functions to merge.
     * @returns {Function}
     */
    getMarkdownConverter (middlewares) {
        const reader = new commonmark.Parser();
        const writer = new commonmark.HtmlRenderer();

        return middlewares.reduce(
            (next, current) => (file) => current(file, next),
            (file) => {
                file.contents = writer.render(
                    reader.parse(file.contents)
                );

                return file;
            }
        );
    },

    /**
     * Saves file under specify path.
     *
     * @param {String|File} filePath
     * @param {String} fileContent
     * @returns {Promise}
     */
    saveFile(filePath, fileContent = '') {
        if (filePath instanceof File) {
            fileContent = filePath.contents;
            filePath = filePath.path;
        }

        return new Promise((resolve, reject) => {
            fs.mkdirsSync(path.dirname(filePath));

            fs.writeFile(filePath, fileContent, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    },

    /**
     * Compiles posts to HTML.
     *
     * @param {String[]} posts Paths to the posts.
     * @param {Function} markdownConverter
     * @param {String} outputPath
     * @returns {File[]}
     */
    compilePosts (posts, markdownConverter, outputPath) {
        return posts.slice()
            .map((post) => {
                return markdownConverter(new File({
                    contents: fs.readFileSync(post, 'utf-8'),
                    basename: path.basename(post).replace(/md$/, 'html'),
                    dirname: outputPath
                }));
            });
    }
};

module.exports = utils;
