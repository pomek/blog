'use strict';

/**
 * @param {Date} date Date to transform.
 * @returns {String}
 */
module.exports = (date) => {
    const polishMonths = [
        'stycznia',
        'lutego',
        'marca',
        'kwietnia',
        'maja',
        'czerwca',
        'lipca',
        'sierpnia',
        'września',
        'października',
        'listopada',
        'grudnia'
    ];

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return `${day} ${polishMonths[month]} ${year}`;
};
