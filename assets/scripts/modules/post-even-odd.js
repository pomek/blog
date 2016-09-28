'use strict';

export default () => {
    const postElements = document.querySelectorAll('.post.post--has-image');
    let counter = 0;

    [...postElements].forEach((post) => {
        post.classList.add(counter++ % 2 ? 'post--odd' : 'post--even');
    });
};
