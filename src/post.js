'use strict';

const File = require('vinyl');

module.exports = class Post extends File {
    constructor (file) {
        super(file);

        this._meta = new Map();
    }

    /**
     * @param {String} key
     * @param {*} value
     * @returns {void}
     */
    setMetaTag (key, value) {
        this._meta.set(key, value);
    }

    /**
     * @param {String} key
     * @returns {*}
     */
    getMetaTag (key) {
        return this._meta.get(key);
    }
};
