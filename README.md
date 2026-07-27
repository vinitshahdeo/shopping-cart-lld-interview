# Online Shopping Cart — Low-Level Design (TypeScript)

An interview-ready LLD of an online shopping cart (add to cart). The focus is clean,
defensible design — **not** maximum features. Only one design pattern is used,
and only where it earns its place.

[![Substack](https://img.shields.io/badge/Substack-FF6719?style=for-the-badge&logo=substack&logoColor=white)](https://vinitshahdeo.substack.com/p/shopping-cart-lld-interview)


> **Kindly refer to a [detailed walk-through blog](https://vinitshahdeo.substack.com/p/shopping-cart-lld-interview) on Substack.**


## Demo

https://github.com/user-attachments/assets/6ef17182-3067-4233-9904-b2f93f4dbb98


## Run it

```bash
npm install && npm start
```

Requires **Node >= 22.6** (we run `.ts` files directly via Node's built-in
TypeScript support — no build step). `npm start` runs
[src/index.ts](src/index.ts).

## Project layout

One file per concept, so each class is easy to find and reason about:

```
src/
  product.ts     Product       — sellable item; owns + guards its stock
  cart-item.ts   CartItem      — one line (product + quantity)
  discount.ts    DiscountStrategy + FlatDiscount / PercentageDiscount  (Strategy)
  cart.ts        Cart          — aggregate root: items, pricing, checkout
  order.ts       Order         — immutable snapshot of a purchase
  user.ts        User          — owns one cart
  utils.ts       round2, randomId
  index.ts       demo / entry point (the only file that does I/O)
```

> Imports use explicit `.ts` extensions (required by Node's native TS runner),
> and type-only imports use `import type` so there are no runtime circular
> dependencies between modules.

## Class model

<img width="1774" height="887" alt="Shopping Cart Class Diagram" src="https://github.com/user-attachments/assets/3c9a5ed2-a980-4876-9748-2ca3cafa89eb" />


| Class | Responsibility |
|-------|----------------|
| `Product` | A sellable item. Owns its stock and **guards the `stock >= 0` invariant** — stock changes only through `reduceStock` / `restock`. |
| `CartItem` | One line in the cart (product + quantity). Computes its own line total; quantity is always `>= 1`. |
| `Cart` | Aggregate root. Holds line items + active discounts, computes subtotal/total, and produces an `Order` at checkout. |
| `DiscountStrategy` | Interface for a discount rule. Implementations: `FlatDiscount`, `PercentageDiscount`. |
| `Order` | Immutable record of a completed purchase (all fields `readonly`). |
| `User` | Owns exactly one `Cart` (composition). |

## Why these design choices

### 1. Encapsulation guards invariants
Stock and quantity are `private` and only mutate through methods that validate
first. You can't construct a `Product` with negative stock, push stock below
zero, or set a cart quantity below 1. Invalid states are simply unrepresentable
from the outside.

### 2. Strategy pattern for discounts (the one pattern we use)
Discounts are the part of the system most likely to grow — flat, percentage,
BOGO, coupon codes, etc. Modelling them behind a single `DiscountStrategy`
interface means **adding a new discount never touches `Cart`** (Open/Closed
Principle). Each strategy takes the subtotal and returns the *amount* to
subtract, so multiple discounts compose by simple addition.

```ts
cart.applyDiscount(new FlatDiscount("Save $2", 2.0));
cart.applyDiscount(new PercentageDiscount("10% off", 10));
```

We deliberately avoided heavier patterns (Visitor, Decorator, Factory) — they'd
be solving problems this scope doesn't have.

### 3. Pricing order is explicit
`getTotal()` applies **discounts first, then tax on the discounted amount** —
the usual retail rule. The order is a classic interview probe, so it's a single,
commented place in the code. Money is rounded to 2 decimals via `round2()`.
> In production you'd store integer cents or use a decimal library to avoid
> floating-point drift — worth saying out loud.

### 4. Checkout is "validate all, then commit"
`checkout()` first checks stock for **every** item, and only then reduces any
stock. This avoids partially decrementing inventory and leaving it inconsistent
if a later item turns out to be unavailable.

### 5. Domain is pure; I/O lives at the edge
Model classes compute and return values — they don't `console.log`. All printing
happens in the `main()` demo. This keeps the domain testable and reusable (e.g.
behind a real API or UI).

## Worked example (matches the demo output)

```
5 apples @ $1            subtotal = $5.00
- FlatDiscount $2        -> $2.00
- PercentageDiscount 10% -> $0.50   (10% of $5)
discounted subtotal      = $5.00 - $2.50 = $2.50
+ 10% tax                = $0.25
TOTAL                    = $2.75
```

## Possible extensions (good things to mention in an interview)

- **Inventory service**: pull stock out of `Product` into a dedicated service
  so multiple carts coordinate (concurrency, reservations, oversell protection).
- **Payment & shipping** as separate services invoked during checkout.
- **Repositories** for `Product` / `Order` persistence.
- **More discount strategies** — they slot in with zero changes to `Cart`.
- **Per-item discounts** vs the cart-level discounts modelled here.

[![Substack](https://img.shields.io/badge/Substack-FF6719?style=for-the-badge&logo=substack&logoColor=white)](https://vinitshahdeo.substack.com/p/shopping-cart-lld-interview)
