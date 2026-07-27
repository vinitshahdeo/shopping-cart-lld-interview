/**
 * Product — a sellable item. Owns its own stock and enforces stock invariants.
 *
 * `price` and identity are immutable; `stock` is mutable but only via methods,
 * so the invariant "stock >= 0" can never be broken from the outside.
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    private stock: number,
  ) {
    if (price < 0) throw new Error("Price cannot be negative");
    if (stock < 0) throw new Error("Stock cannot be negative");
  }

  getStock(): number {
    return this.stock;
  }

  hasStock(qty: number): boolean {
    return this.stock >= qty;
  }

  // Called at checkout. Throws rather than silently corrupting state.
  reduceStock(qty: number): void {
    if (qty > this.stock) {
      throw new Error(`Not enough stock for ${this.name}`);
    }
    this.stock -= qty;
  }

  restock(qty: number): void {
    this.stock += qty;
  }
}
