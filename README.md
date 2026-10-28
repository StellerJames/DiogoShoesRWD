# Diogo Shoes

A responsive storefront for a fictional urban footwear brand, built with plain HTML, CSS, and JavaScript (no frameworks or build step).

## Features

**Responsive design**
- Mobile-first CSS with breakpoints at 48rem (tablet) and 64rem (desktop)
- Collapsible pancake menu on small screens and full nav bar on larger ones
- Fluid type with `clamp()`, auto-fitting CSS Grid product layout, sticky header
- Respects `prefers-reduced-motion`

**JavaScript**
-**Product catalog**: rendered from a data array with `<template>` elements: category filters, debounced search, and sorting, all synced to the URL (`products.html?category=women&sort=price-asc`)
- **Shopping cart** persisted in `localStorage`, with a live header badge, a custom `cart:change` event, and sync across browser tabs
- **Checkout**: quantity controls, remove items, promo code (`STEPBOLD`), free-shipping threshold, and running totals
- **Payment form validation**: card number formatting, card brand detection, Luhn checksum, expiry date checks, and inline accessible error messages
- **Order confirmation** built from `sessionStorage`, with an estimated delivery date that skips weekends and a share button that uses the Web Share API, falling back to copying the link to the clipboard
- Scroll-in animations with `IntersectionObserver`

**Accessibility**
- Semantic landmarks, skip link, labeled form fields, `aria-current`, `aria-expanded`, `aria-pressed`, `aria-invalid`, and live regions for status messages

## Running it

Open `index.html` in a browser, or serve the folder with any static server.

> This is a demo store. No real payments are processed. Use the test card `4242 4242 4242 4242` with any future expiration date.
