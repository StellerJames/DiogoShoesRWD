// Renders product cards from PRODUCTS. On the products page it also wires up
// category filters, search and sorting, and keeps the URL in sync
// (e.g. products.html?category=women&sort=price-asc) so results are shareable.

function createProductCard(product) {

    // A <template> holds HTML that isn't displayed. cloneNode(true) copies it
    // (including everything inside) so user can fill in a fresh card.

    const template = document.getElementById('product-card-template');
    const card = template.content.firstElementChild.cloneNode(true);

    const img = card.querySelector('.product-image');
    img.src = product.image;
    img.alt = product.alt;
    if (product.imagePosition) img.style.objectPosition = product.imagePosition;
    if (product.imageFit === 'contain') img.classList.add('product-image-contain');

    card.querySelector('.product-name').textContent = product.name;
    card.querySelector('.product-category').textContent = product.category === 'men' ? "Men's" : "Women's";
    card.querySelector('.product-price').textContent = formatMoney(product.price);

    // Each card needs its own ids so its label and error message
    // connect to its own size dropdown, not another card's.

    const select = card.querySelector('.product-size');
    const selectId = `size-${product.id}`;
    select.id = selectId;
    card.querySelector('.product-size-label').htmlFor = selectId;
    product.sizes.forEach((size) => select.add(new Option(`US ${size}`, size)));

    const error = card.querySelector('.field-error');
    error.id = `size-error-${product.id}`;
    select.setAttribute('aria-describedby', error.id);

    // Saved on the button as data-product-id so the click handler knows which product it is.

    card.querySelector('.add-to-cart').dataset.productId = product.id;
    return card;
}

// One click listener on the whole grid handles every card's button, even cards
// added later (this is called "event delegation"). closest() finds the
// Add to cart button that was clicked, or returns null for clicks elsewhere.
function handleAddToCart(event) {
    const button = event.target.closest('.add-to-cart');
    if (!button) return;

    const card = button.closest('.product-card');
    const select = card.querySelector('.product-size');
    const error = card.querySelector('.field-error');

    if (!select.value) {
        error.textContent = 'Please choose a size.';
        select.setAttribute('aria-invalid', 'true');
        select.focus();
        return;
    }

    error.textContent = '';
    select.removeAttribute('aria-invalid');

    const product = findProduct(button.dataset.productId);
    Cart.add(product.id, Number(select.value));
    showToast(`Added ${product.name} (US ${select.value}) to your cart.`);

    // Briefly confirm the button itself, then reset it after 1.2 seconds.

    button.textContent = 'Added ✓';
    button.disabled = true;
    setTimeout(() => {
        button.textContent = 'Add to cart';
        button.disabled = false;
    }, 1200);
}

function setupCatalog(grid) {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const sortSelect = document.getElementById('sort');
    const searchInput = document.getElementById('search');
    const status = document.getElementById('results-status');

    // Read the starting filters from the address bar (e.g. ?category=women),
    // so links like "Shop Women's" on the home page open already filtered.

    const params = new URLSearchParams(location.search);
    const state = {
        category: ['men', 'women'].includes(params.get('category')) ? params.get('category') : 'all',
        sort: params.get('sort') || 'featured',
        query: params.get('q') || '',
    };

    sortSelect.value = state.sort;
    searchInput.value = state.query;

    // A sort function compares two items: a negative result puts a first,
    // a positive result puts b first. Returning 0 keeps the original order.

    const sorters = {
        featured: () => 0,
        'price-asc': (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price,
        name: (a, b) => a.name.localeCompare(b.name),
    };

    function render() {
        const query = state.query.trim().toLowerCase();
        const results = PRODUCTS
            .filter((p) => state.category === 'all' || p.category === state.category)
            .filter((p) => p.name.toLowerCase().includes(query))
            .sort(sorters[state.sort] || sorters.featured);

        // The ... (spread) passes each card as a separate argument.

        grid.replaceChildren(...results.map(createProductCard));
        status.textContent = results.length
            ? `Showing ${results.length} of ${PRODUCTS.length} styles`
            : 'No styles match your search.';

        filterButtons.forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.filter === state.category));
        });

        const next = new URLSearchParams();
        if (state.category !== 'all') next.set('category', state.category);
        if (state.sort !== 'featured') next.set('sort', state.sort);
        if (query) next.set('q', state.query.trim());
        const qs = next.toString();

        // Update the address bar without reloading the page or adding a Back-button step.

        history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            state.category = button.dataset.filter;
            render();
        });
    });

    sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        render();
    });

    // "Debounce": each keystroke cancels the previous timer, so the list only
    // re-filters once the user pauses typing for 200 ms.

    let debounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            state.query = searchInput.value;
            render();
        }, 200);
    });

    render();
}

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('[data-product-grid]');
    if (!grid) return;

    grid.addEventListener('click', handleAddToCart);

    // The home page lists a few hand-picked products by id, with no controls.

    const featured = grid.dataset.featured;
    if (featured) {

        // filter(Boolean) drops any id that didn't match a product (findProduct returned undefined).

        const products = featured.split(',').map((id) => findProduct(id.trim())).filter(Boolean);
        grid.replaceChildren(...products.map(createProductCard));
    } else {
        setupCatalog(grid);
    }
});
