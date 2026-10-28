// Product catalog. In a real store this would come from an API;
// keeping it in one place means every page reads the same prices.
// imagePosition is the photo's focal point when it's cropped into a card;
// imageFit: 'contain' shows a wide photo whole instead of cropping it.

const PRODUCTS = [
    {
        id: 'urban-court',
        name: 'Urban Court Sneaker',
        category: 'men',
        price: 149,
        image: 'images/mens.jpg',
        alt: 'Cognac leather low-top sneakers with white laces',
        imagePosition: 'center 45%',
        sizes: [8, 9, 10, 11, 12, 13],
    },
    {
        id: 'midnight-runner',
        name: 'Midnight Runner',
        category: 'men',
        price: 129,
        image: 'images/comfort.jpg',
        alt: 'Man wearing black sneakers',
        imagePosition: 'center 58%',
        sizes: [8, 9, 10, 11, 12],
    },
    {
        id: 'clean-line',
        name: 'Clean Line Sneaker',
        category: 'men',
        price: 119,
        image: 'images/style.jpg',
        alt: 'Man wearing white sneakers',
        imagePosition: 'center bottom',
        sizes: [7, 8, 9, 10, 11, 12],
    },
    {
        id: 'cognac-ankle-boot',
        name: 'Cognac Ankle Boot',
        category: 'women',
        price: 189,
        image: 'images/womens.jpg',
        alt: 'Tan leather ankle boots with a side zip',
        imagePosition: 'center 75%',
        sizes: [6, 7, 8, 9, 10],
    },
    {
        id: 'crimson-oxford',
        name: 'Crimson Oxford',
        category: 'women',
        price: 179,
        image: 'images/quality.jpg',
        alt: 'Woman wearing red oxford shoes',
        imagePosition: 'center bottom',
        sizes: [5, 6, 7, 8, 9, 10],
    },
    {
        id: 'peach-oxford',
        name: 'Peach Oxford',
        category: 'women',
        price: 219,
        image: 'images/peach-oxfords.jpg',
        alt: 'Peach leather lace-up oxfords',
        imageFit: 'contain',
        sizes: [5, 6, 7, 8, 9],
    },
];

function findProduct(id) {
    return PRODUCTS.find((product) => product.id === id);
}

// Intl.NumberFormat is built into JS and handles currency formatting, e.g. 219 -> "$219.00".

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatMoney(amount) {
    return currency.format(amount);
}
