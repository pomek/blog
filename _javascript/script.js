(function (global) {
    'use strict';

    var forEach = Array.prototype.forEach;

    var codeElements = document.querySelectorAll('[class^="language-"]'),
        news = document.querySelectorAll('.js-news');

    forEach.call(codeElements, function (item) {
        // Remove highlight builded by Jekyll
        item.innerText = item.innerText;
        item.classList.add('line-numbers');
        Prism.highlightElement(item);
    });

    forEach.call(news, function (item) {
        item.querySelector('.js-only').classList.remove('hidden');

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
