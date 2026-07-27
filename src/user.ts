import { Cart } from "./cart.ts";

/** User — owns exactly one cart (composition). */
export class User {
  private readonly cart = new Cart();

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  getCart(): Cart {
    return this.cart;
  }
}
