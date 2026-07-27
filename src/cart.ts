import type { Product } from "./product.ts";
import { CartItem } from "./cart-item.ts";
import type { DiscountStrategy } from "./discount.ts";
import { Order } from "./order.ts";
import type { User } from "./user.ts";
import { round2, randomId } from "./utils.ts";

/** 10% — a constant so the tax rule lives in one place. */
export const TAX_RATE = 0.1;

/**
 * Cart — the aggregate root for shopping. Holds line items + active discounts,
 * computes subtotal/total, and produces an Order at checkout.
 *
 * Items are keyed by product id so adding the same product merges quantities
 * (O(1) lookup) instead of creating duplicate lines.
 */
export class Cart {
  private readonly items = new Map<string, CartItem>();
  private readonly discounts: DiscountStrategy[] = [];

  addItem(product: Product, qty: number): void {
    if (qty < 1) throw new Error("Quantity must be at least 1");

    const existing = this.items.get(product.id);
    const desiredQty = (existing?.getQuantity() ?? 0) + qty;

    // Validate against live stock so we never let a cart exceed availability.
    if (!product.hasStock(desiredQty)) {
      throw new Error(`Not enough stock for ${product.name}`);
    }

    if (existing) existing.setQuantity(desiredQty);
    else this.items.set(product.id, new CartItem(product, qty));
  }

  removeItem(productId: string): void {
    this.items.delete(productId);
  }

  // qty <= 0 removes the line; otherwise it sets the absolute quantity.
  updateQuantity(productId: string, qty: number): void {
    const item = this.items.get(productId);
    if (!item) return;

    if (qty <= 0) {
      this.items.delete(productId);
      return;
    }
    if (!item.product.hasStock(qty)) {
      throw new Error(`Not enough stock for ${item.product.name}`);
    }
    item.setQuantity(qty);
  }



  getItems(): readonly CartItem[] {
    return [...this.items.values()];
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  applyDiscount(discount: DiscountStrategy): void {
    this.discounts.push(discount);
  }

  getSubtotal(): number {
    let sum = 0;
    for (const item of this.items.values()) sum += item.getLineTotal();
    return sum;
  }

  // Pricing order matters and is a common interview talking point:
  // we discount FIRST, then tax the discounted amount (the typical retail rule).
  getTotal(): number {
    const subtotal = this.getSubtotal();
    let totalDiscount = 0;
    for (const d of this.discounts) totalDiscount += d.computeDiscount(subtotal);
    const taxable = Math.max(subtotal - totalDiscount, 0);
    const tax = taxable * TAX_RATE;
    return round2(taxable + tax);
  }

  // Checkout is a transaction: validate ALL stock first, then commit.
  // This "check everything, then apply" ordering avoids partially reducing
  // stock and leaving inventory inconsistent if a later item fails.
  checkout(user: User): Order {
    if (this.isEmpty()) throw new Error("Cannot checkout an empty cart");

    for (const item of this.items.values()) {
      if (!item.product.hasStock(item.getQuantity())) {
        throw new Error(`Not enough stock for ${item.product.name}`);
      }
    }

    const total = this.getTotal();
    for (const item of this.items.values()) {
      item.product.reduceStock(item.getQuantity());
    }

    const order = new Order(randomId(), user, this.getItems(), total);

    // Reset the cart so it can be reused.
    this.items.clear();
    this.discounts.length = 0;
    return order;
  }
}
