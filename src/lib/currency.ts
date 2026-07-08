// Single source of truth for the KES/USD display rate - replaces the two
// duplicated `RATE = 130` constants that used to live in CurrencyContext.tsx
// and AdminDashboard.tsx. KES is canonical everywhere in the backend
// (Product.priceKes), USD is a pure display conversion, never persisted.
export const USD_PER_KES = 1 / 130

export function formatKes(priceKes: number): string {
  return `KSh ${Math.round(priceKes).toLocaleString()}`
}

export function formatUsd(priceKes: number): string {
  return `$${(priceKes * USD_PER_KES).toFixed(2)}`
}
