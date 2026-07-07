# Velvet Hive

A small ecommerce storefront — product browsing, search, category filtering,
a product detail view, and a shopping cart with quantity controls.

## Tech stack

- React + TypeScript
- lucide-react for icons
- Plain CSS with custom properties (no framework) — see `styles/global.css`
  for the design tokens
- Poppins (Google Fonts) as the primary typeface

## Setup

```
npm install
npm run dev
```

The app expects a `/api/products` endpoint returning an array of:

```ts
{
  id: number
  name: string
  price: number
  category: string
  image: string
  description?: string  
}
```

## Folder structure

```
src/
  App.tsx
  styles/
    global.css       // variables, reset, page layout, doodle background
    utils.css         // shared button/input/badge/quantity-stepper classes
  components/
    Navbar.tsx / .css
    Hero.tsx / .css
    ProductList.tsx / .css
    ProductCard.tsx / .css
    ProductDetail.tsx / .css
    Cart.tsx / .css
    Checkout.tsx / .css
```

