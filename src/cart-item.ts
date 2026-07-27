import type { Product } from "./product.ts";

/**
 * CartItem — a line in the cart: one product + a quantity.
 * Knows how to compute its own line total. Quantity is always >= 1.
 */
export class CartItem {
  constructor(
    public readonly product: Product,
    private quantity: number,
  ) {
    this.setQuantity(quantity);
  }

  getQuantity(): number {
    return this.quantity;
  }

  setQuantity(quantity: number): void {
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    this.quantity = quantity;
  }

  getLineTotal(): number {
    return this.product.price * this.quantity;
  }
}
