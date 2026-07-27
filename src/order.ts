import type { CartItem } from "./cart-item.ts";
import type { User } from "./user.ts";

/**
 * Order — an immutable snapshot of a completed purchase. Once created, nothing
 * about it can change (all fields readonly), which is what you want for a
 * historical record.
 */
export class Order {
  constructor(
    public readonly orderId: string,
    public readonly user: User,
    public readonly items: readonly CartItem[],
    public readonly totalAmount: number,
  ) {}
}
