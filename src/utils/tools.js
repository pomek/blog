'use strict';

const path = require('path');
const fs = require('fs-extra');
const commonmark = require('commonmark');
const File = require('../file');
const dateMapper = require('../plugins/pug/date-mapper');

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
     * @param {File} file
     * @param {String} destinationDir
     * @returns {Promise}
     */
    saveFile(file, destinationDir = '') {
        const filePath = path.join(destinationDir, file.path);

        return new Promise((resolve, reject) => {
            fs.mkdirsSync(path.dirname(filePath));

            fs.writeFile(filePath, file.contents, 'utf-8', (err) => {
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
     * @returns {File[]}
     */
    compilePosts (posts, markdownConverter) {
        return posts.slice()
            .map((post) => {
                return markdownConverter(new File({
                    contents: fs.readFileSync(post, 'utf-8'),
                    basename: 'index.html',
                    dirname: path.basename(post, '.md')
                }));
            });
    },

    /**
     * @returns {Object} options
     * @returns {Boolean} options.browser=false
     * @returns {Boolean} options.b=false
     * @returns {Boolean} options.debug=false
     * @returns {Boolean} options.d=false
     */
    parseArguments() {
        return require('minimist')(process.argv.slice(2), {
            boolean: [
                'browser',
                'debug'
            ],
            alias: {
                B: 'browser',
                D: 'debug'
            },
            default: {
                browser: false,
                debug: false
            }
        });
    },

    /**
     * @returns {Object} utils
     * @returns {Function} utils.path
     * @returns {Function} utils.date
     */
    getPugUtils() {
        return {
            path: path.join.bind(path),
            date: dateMapper
        }
    }
};

module.exports = utils;
