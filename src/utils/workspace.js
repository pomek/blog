'use strict';

const path = require('path');
const fs = require('fs-extra');

const utils = {
    /**
     * Returns an array with paths to all available posts.
     *
     * @param {String} postDir Path to parse.
     * @returns {Promise}
     */
    getPosts(postDir) {
        return new Promise((resolve, reject) => {
            fs.readdir(postDir, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve(data.map((file) => path.join(postDir, file)));
            });
        });
    },

    /**
     * Change orders of posts. This method doesn't touch the input argument.
     * It copies the input array and changes the copy.
     *
     * @param {String[]} posts Paths to posts which will be sorted.
     * @param {String} [direction='DESC'] direction
     */
    orderPostsByDate(posts, direction = 'DESC') {
        const isDescOrder = 'DESC' === direction;
        const fieldRegex = new RegExp(/created_at\: ([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        const postsData = {};
        const sortedPosts = posts.slice();

        posts.forEach((post) => {
            const content = fs.readFileSync(post, 'utf-8');
            postsData[post] = new Date(content.match(fieldRegex)[1]);
        });

        sortedPosts.sort((firstPost, secondPost) => {
            if (postsData[firstPost] > postsData[secondPost]) {
                return isDescOrder ? -1 : 1;
            } else if (postsData[firstPost] < postsData[secondPost]) {
                return isDescOrder ? 1 : -1;
            }

            return 0;
        });

        return Promise.resolve(sortedPosts);
    }
};

module.exports = utils;
