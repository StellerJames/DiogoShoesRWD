// Behavior shared by every page: mobile menu, current-page link,
// cart badge, footer year, toast messages and scroll-in animations.

// Lets CSS hide .reveal elements only when JS is available to show them again.

document.documentElement.classList.add('js');

function setupNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    // aria-expanded tells screen readers whether the menu is open.
    // The CSS also checks it to turn the three bars into an X.

    const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    // Close the menu if the window grows past the mobile breakpoint.

    window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
        if (event.matches) setOpen(false);
    });
}

function markCurrentPage() {

    // Turns "/site/products.html" into "products.html". An empty result means
    // the site's root address, which shows index.html.

    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a, .cart-link').forEach((link) => {
        if (link.getAttribute('href') === page) {
            link.setAttribute('aria-current', 'page');
        }
    });
}

function updateCartBadge() {
    const count = Cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
        badge.textContent = count;
        badge.hidden = count === 0;
    });
    const cartLink = document.querySelector('.cart-link');
    if (cartLink) {
        cartLink.setAttribute('aria-label', `Cart, ${count} ${count === 1 ? 'item' : 'items'}`);
    }
}

function setFooterYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
        el.textContent = new Date().getFullYear();
    });
}

let toastTimer;
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');

    // Restart the hide timer so a new message stays up for the full 2.5 seconds.

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

function setupReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    // Very old browsers don't have IntersectionObserver; just show everything.

    if (!('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-visible'));
        return;
    }

    // IntersectionObserver tells us when an element scrolls into view, without
    // checking on every scroll. threshold: 0.15 means "once 15% of it is visible".

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');

                // Animate only once, then stop watching this element.

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach((el) => observer.observe(el));
}

// DOMContentLoaded fires once the HTML is fully loaded, so the elements we look up exist.

document.addEventListener('DOMContentLoaded', () => {
    setupNavToggle();
    markCurrentPage();
    updateCartBadge();
    setFooterYear();
    setupReveal();
});

window.addEventListener('cart:change', updateCartBadge);
