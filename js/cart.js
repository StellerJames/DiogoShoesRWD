// Cart is saved in the browser, so it isn’t lost when you go to another page/refresh.
// Every change fires a "cart:change" event so any page can re-render.
//
// The (() => { ... })() pattern runs the function right away and keeps the
// variables inside it private. Only what it returns at the bottom
// (Cart.add, Cart.count, ...) can be used by other files.

const Cart = (() => {
    const STORAGE_KEY = 'diogo-cart';
    const FREE_SHIPPING_MIN = 150;
    const SHIPPING_COST = 9;
    const PROMO_CODES = { STEPBOLD: 0.1 };

    function read() {
        try {

            // localStorage only stores text, so JSON.parse turns it back into an array.
            // On a first visit nothing is saved yet, so fall back to an empty cart.

            const items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

            // Drop anything that no longer matches the catalog (stale or edited storage).

            return items.filter((item) => {
                const product = findProduct(item.id);
                return product && product.sizes.includes(item.size) && item.qty > 0;
            });
        } catch {
            return [];
        }
    }

    function write(items) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {

            // // Saving can fail (e.g. private browsing, or the user blocks site data).
            // Ignore the error so the page doesn't crash.
        }
        // Announce the change. Pages react with addEventListener('cart:change', ...).

        window.dispatchEvent(new CustomEvent('cart:change', { detail: { items } }));
    }

    function getItems() {
        return read();
    }

    function add(id, size, qty = 1) {
        const items = read();

        // Same shoe in the same size? Raise its quantity (max 10) instead of adding a second line.

        const existing = items.find((item) => item.id === id && item.size === size);
        if (existing) {
            existing.qty = Math.min(existing.qty + qty, 10);
        } else {
            items.push({ id, size, qty });
        }
        write(items);
    }

    function setQty(id, size, qty) {

        // map() copies the list with this one item's quantity changed;
        // filter() then drops anything at 0, so setting 0 removes the item.

        const items = read()
            .map((item) => (item.id === id && item.size === size ? { ...item, qty } : item))
            .filter((item) => item.qty > 0);
        write(items);
    }

    function remove(id, size) {
        setQty(id, size, 0);
    }

    function clear() {
        write([]);
    }

    function count() {

        // reduce() goes through a list one item at a time and combines everything into a single value, starting from 0.

        return read().reduce((sum, item) => sum + item.qty, 0);
    }

    function discountRate(code) {
        return PROMO_CODES[(code || '').trim().toUpperCase()] || 0;
    }

    // Prices always come from the catalog, never from storage.
    function totals(promoCode = '') {
        const subtotal = read().reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);

        // Round to whole cents. Decimal math in JS can produce values like 21.900000000000002.

        const discount = Math.round(subtotal * discountRate(promoCode) * 100) / 100;
        const afterDiscount = subtotal - discount;
        const shipping = afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
        return { subtotal, discount, shipping, total: afterDiscount + shipping, freeShippingMin: FREE_SHIPPING_MIN };
    }

    // The 'storage' event fires when a different tab changes localStorage,
    // so a cart updated in one tab updates in every open tab.

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            window.dispatchEvent(new CustomEvent('cart:change', { detail: { items: read() } }));
        }
    });

    return { getItems, add, setQty, remove, clear, count, totals, discountRate };
})();
