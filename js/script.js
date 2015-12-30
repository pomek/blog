(function (global) {
    'use strict';

    var news = document.querySelectorAll('.js-news');

    Array.prototype.forEach.call(news, function (item) {
        item.querySelector('.js-facebook')
            .addEventListener('click', function (e) {
                global.open(this.href, "sharer", "toolbar=0,status=0,width=626,height=436");
                e.preventDefault();
            });

        item.querySelector('.js-twitter')
            .addEventListener('click', function (e) {
                global.open(this.href, "sharer", "toolbar=0,status=0,width=626,height=436");
                e.preventDefault();
            });

        item.querySelector('.js-google')
            .addEventListener('click', function (e) {
                global.open(this.href, "sharer", "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600");
                e.preventDefault();
            });
    });
})(this);
