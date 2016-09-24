'use strict';

export default () => {
    const postElements = document.querySelectorAll('.post.post--has-image');

    [...postElements].forEach((post) => {
        const imageElement = post.querySelector('.post__image');

        imageElement.classList.add('post__image--link');

        imageElement.addEventListener('click', (e) => {
            e.preventDefault();
            post.querySelector('.post__title-link').click();
        });
    });
}
