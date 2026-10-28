// Checkout page: editable order summary, promo codes, and a payment form
// with live formatting and validation. This is a demo store, so the "payment"
// is simulated and only the card brand and last four digits are kept.

const ORDER_KEY = 'diogo-last-order';

// The applied promo code. It isn't saved, so reloading the page clears it.

let promoCode = '';

// Order summary

// Rebuilds the whole list each time the cart changes. That's simpler than
// finding and updating individual rows, and fast for a small cart.
function renderCart() {
    const list = document.getElementById('cart-items');
    const empty = document.getElementById('cart-empty');
    const form = document.getElementById('checkout-form');
    const items = Cart.getItems();

    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    form.querySelector('[type="submit"]').disabled = items.length === 0;

    const template = document.getElementById('cart-item-template');
    list.replaceChildren(...items.map((item) => {
        const product = findProduct(item.id);
        const row = template.content.firstElementChild.cloneNode(true);

        // Remember which item this row is, for the click handler below.

        row.dataset.id = item.id;
        row.dataset.size = item.size;

        const img = row.querySelector('img');
        img.src = product.image;
        img.alt = product.alt;
        row.querySelector('.cart-item-name').textContent = product.name;
        row.querySelector('.cart-item-size').textContent = `Size US ${item.size}`;
        row.querySelector('.qty-value').textContent = item.qty;
        row.querySelector('.cart-item-price').textContent = formatMoney(product.price * item.qty);
        row.querySelector('[data-action="decrease"]').setAttribute('aria-label', `Decrease quantity of ${product.name}`);
        row.querySelector('[data-action="increase"]').setAttribute('aria-label', `Increase quantity of ${product.name}`);
        row.querySelector('[data-action="increase"]').disabled = item.qty >= 10;
        row.querySelector('[data-action="remove"]').setAttribute('aria-label', `Remove ${product.name} from cart`);
        return row;
    }));

    renderTotals();
}

function renderTotals() {
    const t = Cart.totals(promoCode);
    document.getElementById('subtotal').textContent = formatMoney(t.subtotal);
    document.getElementById('discount').textContent = `−${formatMoney(t.discount)}`;
    document.getElementById('discount-row').hidden = t.discount === 0;
    document.getElementById('shipping').textContent = t.shipping === 0 ? 'Free' : formatMoney(t.shipping);
    document.getElementById('total').textContent = formatMoney(t.total);

    const note = document.getElementById('shipping-note');
    const remaining = t.freeShippingMin - (t.subtotal - t.discount);
    note.textContent = t.subtotal > 0 && remaining > 0
        ? `Add ${formatMoney(remaining)} more for free shipping.`
        : '';
}

// One listener for every button in the cart list. Each button's
// data-action attribute ("increase", "decrease" or "remove") says what it does.
function handleCartClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const row = button.closest('.cart-item');
    const id = row.dataset.id;
    const size = Number(row.dataset.size);
    const item = Cart.getItems().find((i) => i.id === id && i.size === size);
    if (!item) return;

    switch (button.dataset.action) {
        case 'increase':
            Cart.setQty(id, size, Math.min(item.qty + 1, 10));
            break;
        case 'decrease':
            Cart.setQty(id, size, item.qty - 1);
            break;
        case 'remove':
            Cart.remove(id, size);
            showToast(`Removed ${findProduct(id).name}.`);
            break;
    }

    // Re-rendering replaces the buttons, so put focus back where the user was.

    const sameButton = document.querySelector(
        `.cart-item[data-id="${id}"][data-size="${size}"] [data-action="${button.dataset.action}"]`
    );
    (sameButton || document.getElementById('cart-heading')).focus();
}

function setupPromo() {
    const form = document.getElementById('promo-form');
    const input = document.getElementById('promo');
    const message = document.getElementById('promo-message');

    form.addEventListener('submit', (event) => {

        // Stop the browser's normal form submit, which would reload the page.

        event.preventDefault();
        const rate = Cart.discountRate(input.value);
        if (rate) {
            promoCode = input.value.trim().toUpperCase();
            message.textContent = `${promoCode} applied: ${rate * 100}% off.`;
            message.className = 'promo-message is-success';
        } else {
            promoCode = '';
            message.textContent = 'That code isn’t valid.';
            message.className = 'promo-message is-error';
        }
        renderTotals();
    });
}

//  Payment form

// A card's first digits identify its brand (e.g. Visa starts with 4).
// "groups" is how the number is spaced: Amex is 4-6-5, the others 4-4-4-4.

const CARD_BRANDS = [
    { name: 'Amex', pattern: /^3[47]/, cvcLength: 4, groups: [4, 6, 5] },
    { name: 'Visa', pattern: /^4/, cvcLength: 3, groups: [4, 4, 4, 4] },
    { name: 'Mastercard', pattern: /^(5[1-5]|2[2-7])/, cvcLength: 3, groups: [4, 4, 4, 4] },
    { name: 'Discover', pattern: /^6(011|5)/, cvcLength: 3, groups: [4, 4, 4, 4] },
];

function detectBrand(digits) {
    return CARD_BRANDS.find((brand) => brand.pattern.test(digits));
}

// Luhn checksum: catches most typos in card numbers.
// Going from the last digit backwards, double every second digit
// (subtracting 9 if that's over 9), then add everything up.
// A real card number always adds up to a multiple of 10.

function passesLuhn(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let digit = Number(digits[digits.length - 1 - i]);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    return sum % 10 === 0;
}

function formatCardNumber(digits) {
    const groups = (detectBrand(digits) || CARD_BRANDS[1]).groups;
    const parts = [];
    let index = 0;
    for (const size of groups) {
        if (index >= digits.length) break;
        parts.push(digits.slice(index, index + size));
        index += size;
    }
    return parts.join(' ');
}

// \D means "any character that isn't a digit"; the g flag replaces all of them.

const onlyDigits = (value) => value.replace(/\D/g, '');

// Each validator returns an error message, or '' when the value is fine.

const validators = {
    email(value) {
        if (!value.trim()) return 'Enter your email address.';

        // Roughly: some text, an @, more text, a dot, then at least 2 characters.

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return 'Enter a valid email, like name@example.com.';
        return '';
    },
    name(value) {
        return value.trim().length >= 2 ? '' : 'Enter the name on your card.';
    },
    card(value) {
        const digits = onlyDigits(value);
        if (!digits) return 'Enter your card number.';
        const brand = detectBrand(digits);
        const expected = brand && brand.name === 'Amex' ? 15 : 16;
        if (digits.length !== expected) return `Card number should be ${expected} digits.`;
        if (!passesLuhn(digits)) return 'That card number isn’t valid. Check for typos.';
        return '';
    },
    expiry(value) {

        // Each (\d{2}) captures two digits: match[1] is the month, match[2] the year.

        const match = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
        if (!match) return 'Use the format MM/YY.';
        const month = Number(match[1]);
        const year = 2000 + Number(match[2]);
        if (month < 1 || month > 12) return 'Month must be between 01 and 12.';

        // A card is valid through the last day of its expiry month.
        // JS counts months from 0, so `month` here points at the *next* month,
        // and day 0 of the next month is the last day of this one.

        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        if (endOfMonth < new Date()) return 'This card has expired.';
        return '';
    },
    cvc(value) {
        const brand = detectBrand(onlyDigits(document.getElementById('card').value));
        const length = brand ? brand.cvcLength : 3;

        // Built from a string so the required digit count can change (3, or 4 for Amex).

        return new RegExp(`^\\d{${length}}$`).test(value) ? '' : `Enter the ${length}-digit security code.`;
    },
    zip(value) {
        // 5 digits, optionally followed by a dash and 4 more (ZIP+4).

        return /^\d{5}(-\d{4})?$/.test(value.trim()) ? '' : 'Enter a 5-digit ZIP code.';
    },
};

// Picks the validator that matches the input's name attribute
// (name="email" -> validators.email). Returns true if the field is valid.

function validateField(input) {
    const message = validators[input.name](input.value);
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
}

function setupInputMasks() {
    const card = document.getElementById('card');
    const brandLabel = document.getElementById('card-brand');
    const expiry = document.getElementById('expiry');
    const cvc = document.getElementById('cvc');

    // Reformat on every keystroke: strip out spaces, limit the length, then re-add spaces.

    card.addEventListener('input', () => {
        const digits = onlyDigits(card.value).slice(0, 16);
        const brand = detectBrand(digits);
        card.value = formatCardNumber(brand && brand.name === 'Amex' ? digits.slice(0, 15) : digits);
        brandLabel.textContent = brand ? brand.name : '';
        cvc.maxLength = brand ? brand.cvcLength : 3;
    });

    expiry.addEventListener('input', (event) => {
        let digits = onlyDigits(expiry.value).slice(0, 4);

        // Typing "4" means April: pad it to "04".

        if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;

        // Add the slash after the month, except while deleting. Otherwise
        // Backspace would keep re-adding it and get stuck on "04/".

        const deleting = event.inputType && event.inputType.startsWith('delete');
        expiry.value = digits.length >= 2 && !(deleting && digits.length === 2)
            ? `${digits.slice(0, 2)}/${digits.slice(2)}`
            : digits;
    });

    cvc.addEventListener('input', () => {
        cvc.value = onlyDigits(cvc.value);
    });
}

function setupPaymentForm() {
    const form = document.getElementById('checkout-form');
    const fields = [...form.querySelectorAll('input[name]')];

    // Validate when the user leaves a field, then live once they've seen an error.

    fields.forEach((input) => {
        input.addEventListener('blur', () => {
            if (input.value) validateField(input);
        });
        input.addEventListener('input', () => {
            if (input.getAttribute('aria-invalid') === 'true') validateField(input);
        });
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Check every field (so all errors show at once), then focus the first bad one.

        const results = fields.map(validateField);
        const firstInvalid = fields[results.indexOf(false)];
        if (firstInvalid) {
            document.getElementById('form-error').textContent = 'Please fix the highlighted fields.';
            firstInvalid.focus();
            return;
        }
        document.getElementById('form-error').textContent = '';

        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = 'Processing…';
        form.setAttribute('aria-busy', 'true');

        // Stand-in for a call to a payment API. `await` pauses this function
        // for 1.2 seconds without freezing the rest of the page.

        await new Promise((resolve) => setTimeout(resolve, 1200));

        const digits = onlyDigits(form.card.value);
        const order = {

            // The current time in base 36 makes a short, practically unique order number.

            number: `DS-${Date.now().toString(36).toUpperCase()}`,
            placedAt: new Date().toISOString(),
            email: form.email.value.trim(),
            items: Cart.getItems(),
            totals: Cart.totals(promoCode),
            promoCode,
            card: { brand: (detectBrand(digits) || {}).name || 'Card', last4: digits.slice(-4) },
        };

        // sessionStorage is like localStorage but is cleared when the tab closes.
        // Only the card's last 4 digits are saved, never the full number.

        sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
        Cart.clear();
        location.href = 'confirmation.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cart-items').addEventListener('click', handleCartClick);
    window.addEventListener('cart:change', renderCart);
    setupPromo();
    setupInputMasks();
    setupPaymentForm();
    renderCart();
});
