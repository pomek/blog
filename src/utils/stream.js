'use strict';

const through = require('through2');
const gulpRename = require('gulp-rename');
const Post = require('../post');

const utils = {
    /**
     * Method allows applying some operations on streams.
     *
     * @param {Function} callback Function to call.
     * @returns {Function}
     */
    loop(callback) {
        return through.obj((chunk, encoding, done) => {
            const result = callback(chunk);

            if (result instanceof Promise) {
                result
                    .then((response) => {
                        return done(null, response instanceof Post ? response : chunk);
                    })
                    .catch((err) => {
                        done(err);
                    });
            } else {
                done(null, result instanceof Post ? result : chunk);
            }
        });
    },

    /**
     * Removes the created date from name's posts.
     *
     * @returns {Stream}
     */
    renamePosts() {
        return gulpRename((file) => {
            file.basename = file.basename.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}-/, '');
            file.extname = '.html';
        });
    }
};

module.exports = utils;
