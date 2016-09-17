'use strict';

export default () => {
    const socialIcons = document.querySelectorAll('.socials__icon');

    [...socialIcons].forEach((icon) => {
        // Get title for the icon.
        const label = icon.querySelector('.socials__label');

        // Find a type of the icon.
        const iconName = icon.classList.value.match(/--([A-Z]+)/i)[1];

        // Whether the icon is a square.
        const isSquare = ('true' == icon.getAttribute('data-square'));
        let iconClass = `fa-${iconName}`;

        if (isSquare) {
            iconClass += '-square';
        }

        // The icon element.
        const iconElement = document.createElement('span');

        iconElement.setAttribute('title', label.firstChild.wholeText);
        iconElement.classList.add(iconClass);

        icon.appendChild(iconElement);
    });
}
