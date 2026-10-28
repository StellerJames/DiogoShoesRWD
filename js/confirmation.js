// Shows the order that checkout.js saved to sessionStorage,
// plus an estimated delivery date and a share button.

function addBusinessDays(date, days) {
    const result = new Date(date);
    while (days > 0) {
        result.setDate(result.getDate() + 1);

        // getDay() returns 0 for Sunday and 6 for Saturday; weekends don't count.

        const day = result.getDay();
        if (day !== 0 && day !== 6) days--;
    }
    return result;
}

function renderOrder(order) {
    document.getElementById('order-number').textContent = order.number;
    document.getElementById('order-email').textContent = order.email;
    document.getElementById('order-card').textContent = `${order.card.brand} ending in ${order.card.last4}`;

    const delivery = addBusinessDays(new Date(order.placedAt), 5);
    document.getElementById('order-delivery').textContent = delivery.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    const list = document.getElementById('order-items');
    list.replaceChildren(...order.items.map((item) => {
        const product = findProduct(item.id);
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = `${product.name} · US ${item.size} × ${item.qty}`;
        const price = document.createElement('span');
        price.textContent = formatMoney(product.price * item.qty);
        li.append(name, price);
        return li;
    }));

    const t = order.totals;
    document.getElementById('order-shipping').textContent = t.shipping === 0 ? 'Free' : formatMoney(t.shipping);
    document.getElementById('order-discount').textContent = `−${formatMoney(t.discount)}`;
    document.getElementById('order-discount-row').hidden = t.discount === 0;
    document.getElementById('order-total').textContent = formatMoney(t.total);
}

function setupShare() {
    const button = document.getElementById('share-button');
    const shareData = {
        title: 'Diogo Shoes',
        text: 'Step bold, stay urban. Check out Diogo Shoes!',

        // Builds the full home page address from this page's address.

        url: new URL('index.html', location.href).href,
    };

    // navigator.share opens the device's built-in share menu (common on phones).
    // Where it isn't supported, copy the link to the clipboard instead.

    button.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {

                // The user closed the share sheet; nothing to do.

            }
            return;
        }
        try {
            await navigator.clipboard.writeText(shareData.url);
            showToast('Link copied to your clipboard.');
        } catch {
            showToast(`Share this link: ${shareData.url}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    let order = null;
    try {
        order = JSON.parse(sessionStorage.getItem('diogo-last-order'));
    } catch {
        order = null;
    }

    // Only show the order if one was saved and its products still exist.

    const valid = order && Array.isArray(order.items) && order.items.every((item) => findProduct(item.id));
    document.getElementById('order-details').hidden = !valid;
    document.getElementById('no-order').hidden = Boolean(valid);
    if (valid) renderOrder(order);

    setupShare();
});
