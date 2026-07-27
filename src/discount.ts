/**
 * DiscountStrategy — the one design pattern we lean on: **Strategy**.
 *
 * Why a pattern here? Discounts are the part of the system most likely to grow
 * (flat off, percentage off, buy-one-get-one, coupon codes...). Modelling them
 * behind a single interface lets us add new rules without editing Cart — the
 * Open/Closed Principle in action.
 *
 * Each strategy receives the subtotal and returns the discount AMOUNT to
 * subtract. Returning an amount (not a new total) keeps strategies composable:
 * the cart can sum several discounts together.
 */
export interface DiscountStrategy {
  readonly description: string;
  computeDiscount(subtotal: number): number;
}

/** Flat amount off the subtotal, never more than the subtotal itself. */
export class FlatDiscount implements DiscountStrategy {
  constructor(
    public readonly description: string,
    private readonly amount: number,
  ) {}

  computeDiscount(subtotal: number): number {
    return Math.min(this.amount, subtotal);
  }
}

/** Percentage off the subtotal, e.g. percent = 10 -> 10% off. */
export class PercentageDiscount implements DiscountStrategy {
  constructor(
    public readonly description: string,
    private readonly percent: number,
  ) {
    if (percent < 0 || percent > 100) {
      throw new Error("Percent must be between 0 and 100");
    }
  }

  computeDiscount(subtotal: number): number {
    return (subtotal * this.percent) / 100;
  }
}
