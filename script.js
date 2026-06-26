document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobile-menu'); // Select the mobile menu toggle
    const nav = document.querySelector('nav'); // Select the nav element

    // Add click event listener to the mobile menu
    mobileMenu.addEventListener('click', () => {
        nav.classList.toggle('active'); // Toggle the active class on nav

        // Toggle icons based on the active state
        if (nav.classList.contains('active')) {
            mobileMenu.innerHTML = '&times;'; // Change to close icon
        } else {
            mobileMenu.innerHTML = '&#9776;'; // Change back to hamburger icon
        }
    });
});