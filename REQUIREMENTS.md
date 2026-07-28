# Shopping Cart — Requirements & Interview Notes

A companion to [README.md](README.md). This is the "before you write code" part of
an LLD interview: clarify scope, state requirements, then design. The advice below
is **what to say out loud**, not just what we ended up building.

---

## 1. Clarifying questions to ask first

Never start coding. Spend 2–3 minutes narrowing scope — it signals seniority and
stops you from over-building. Good questions for this problem:

**Scope & flow**
- Are we designing just the **cart**, or the full checkout (payment, shipping, order tracking) too?
- Single user with one cart, or do we need **multiple carts / saved-for-later**?
- Guest carts (anonymous) or **logged-in users only**?

**Catalog & inventory**
- Is **stock/inventory** part of our responsibility, or owned by a separate service?
- Do we reserve stock when added to cart, or only **check at checkout**?
- Can the same product appear once (merge quantities) or as **multiple distinct lines**?

**Pricing & promotions**
- What **discount types** do we support — flat, percentage, BOGO, coupon codes?
- Can **multiple discounts stack**? In what order? Is there a cap?
- Is **tax** in scope? Flat rate or region-dependent? Applied before or after discount?
- Currency — single or **multi-currency**? (Money rounding matters.)

**Scale & environment**
- Roughly how many **concurrent users**? (Drives the concurrency story.)
- In-memory exercise, or backed by a **database / distributed** system?
- Any **persistence** expectation (cart survives logout / page refresh)?

> For this exercise we assumed: logged-in user, one cart, we own a *simple* in-memory
> stock count, products merge by id, flat + percentage discounts that stack, a single
> flat tax applied **after** discounts, single currency. State your assumptions like this.

---

## 2. Functional requirements (what the system does)

**In scope (built):**
1. **Add** a product to the cart with a quantity; adding an existing product **merges** quantities.
2. **Remove** a product line from the cart.
3. **Update** a product's quantity; setting quantity `<= 0` removes the line.
4. **View** the cart: line items, per-line totals, and subtotal.
5. **Apply discounts** to the cart (flat amount, percentage). Multiple discounts **stack**.
6. **Compute the total**: subtotal → apply discounts → apply tax on the discounted amount.
7. **Checkout**: validate stock for all items, atomically reduce stock, produce an immutable **Order**, and clear the cart.
8. **Guard invariants**: no negative stock, quantity always `>= 1`, can't add/checkout beyond available stock, can't checkout an empty cart.

**Out of scope (would mention, not build):**
- Payment processing, refunds.
- Shipping, addresses, delivery estimates.
- Order history / tracking after purchase.
- Product catalog management (search, categories, reviews).
- Wishlists / save-for-later, multiple carts.
- Coupon-code redemption, loyalty points.

---

## 3. Non-functional requirements (how well it does it)

| Attribute | Goal | How it shows up in the design |
|---|---|---|
| **Correctness** | Pricing and stock math always consistent; no overselling. | Invariants enforced in domain methods; `round2` for money; checkout validates *all* then commits. |
| **Extensibility** | New discount types without touching `Cart`. | **Strategy pattern** behind `DiscountStrategy` (Open/Closed Principle). |
| **Encapsulation / maintainability** | Invalid states unrepresentable; one responsibility per class. | `private` mutable fields + validated setters; one file per concept. |
| **Testability** | Domain logic unit-testable without I/O. | Pure domain — no `console.log` in model; I/O isolated in `index.ts`. |
| **Concurrency safety** | No lost updates / oversell under load. | In-process safe (single-threaded JS); real systems need atomic DB decrement / reservations — see README "Concurrency". |
| **Performance** | O(1) add/remove/update per product. | Items keyed by `productId` in a `Map`. |
| **Consistency (checkout)** | All-or-nothing stock commit. | "Validate all, then commit"; in production wrap in a DB transaction. |


> [!TIP]
> Rule of thumb: pick the **2–3 NFRs that matter most** for the prompt and design for
> them explicitly. Here that's **extensibility (discounts)**, **correctness (money/stock)**,
> and **concurrency** if the interviewer pushes on scale.

## 4. Core entities & responsibilities

| Entity | Responsibility | Key invariant |
|---|---|---|
| `Product` | Sellable item; owns stock. | `stock >= 0` |
| `CartItem` | One line: product + quantity; computes line total. | `quantity >= 1` |
| `Cart` | Aggregate root; items + discounts; pricing; checkout. | No line exceeds available stock |
| `DiscountStrategy` | Pluggable discount rule (Strategy). | Returns an amount `>= 0` |
| `Order` | Immutable snapshot of a completed purchase. | Fully `readonly` after creation |
| `User` | Owns one cart. | One cart per user |

---

## 5. Public API surface (the "interface" you'd sketch on the board)

```ts
// Cart
addItem(product: Product, qty: number): void
removeItem(productId: string): void
updateQuantity(productId: string, qty: number): void
applyDiscount(discount: DiscountStrategy): void
getSubtotal(): number
getTotal(): number          // discounts first, then tax
checkout(user: User): Order

// Product
hasStock(qty: number): boolean
reduceStock(qty: number): void
restock(qty: number): void

// DiscountStrategy (Strategy pattern)
computeDiscount(subtotal: number): number
```

---

## 6. Edge cases to call out

- Add quantity that exceeds stock → reject.
- Add the same product twice → quantities merge, re-validated against stock.
- Update quantity to `0` or negative → line removed.
- Discount larger than subtotal → clamp so total never goes negative.
- Multiple stacked discounts → summed; total floored at `0`.
- Checkout with an empty cart → reject.
- Checkout when stock changed since adding → re-validated; all-or-nothing.
- Floating-point money (`0.1 + 0.2`) → round to 2 dp (note: integer cents in prod).

---

## 7. How to drive the interview (sequence)

1. **Clarify** scope with the questions in §1; state assumptions.
2. **List** functional + the 2–3 key non-functional requirements (§2–3).
3. **Identify entities** and their relationships (§4); draw the class diagram.
4. **Define the API** (§5), then fill in pricing + checkout logic.
5. **Walk edge cases** (§6) and the concurrency story (README).
6. **Mention extensions** last: payments, reservations, persistence, multi-currency.
