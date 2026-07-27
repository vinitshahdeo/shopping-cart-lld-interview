/*
 * Low-Level Design: Online Shopping Cart — demo / entry point.
 *
 * This is the ONLY file that does I/O. The domain modules compute and return
 * values; presentation lives here. Run with:  npm start
 *
 * Module map:
 *   product.ts    Product       — sellable item, owns + guards its stock
 *   cart-item.ts  CartItem      — one line (product + quantity)
 *   discount.ts   DiscountStrategy + FlatDiscount/PercentageDiscount (Strategy)
 *   cart.ts       Cart          — aggregate root: items, pricing, checkout
 *   order.ts      Order         — immutable snapshot of a purchase
 *   user.ts       User          — owns one cart
 *   utils.ts      round2, randomId
 */
import { Product } from "./product.ts";
import { User } from "./user.ts";
import { Cart } from "./cart.ts";
import { FlatDiscount, PercentageDiscount } from "./discount.ts";
import { TAX_RATE } from "./cart.ts";

function printCart(cart: Cart): void {
  console.log("Your Cart:");
  if (cart.isEmpty()) {
    console.log("  (empty)");
  } else {
    for (const item of cart.getItems()) {
      console.log(
        `  - ${item.product.name} x${item.getQuantity()} ` +
          `($${item.product.price} each) = $${item.getLineTotal()}`,
      );
    }
  }
  console.log(`  Subtotal: $${cart.getSubtotal()}`);
}

function main(): void {
  // Catalog
  const apple = new Product("p1", "Apple", 1.0, 10);
  const bread = new Product("p2", "Bread", 2.5, 5);

  // A shopper
  const user = new User("u1", "Alice");
  const cart = user.getCart();

  cart.addItem(apple, 3);
  cart.addItem(bread, 2);
  printCart(cart);

  console.log("\n-- updating cart --");
  cart.updateQuantity(apple.id, 5); // bump apples to 5
  cart.removeItem(bread.id); // drop the bread
  printCart(cart);

  console.log("\n-- applying discounts --");
  cart.applyDiscount(new FlatDiscount("Save $2", 2.0));
  cart.applyDiscount(new PercentageDiscount("10% off", 10));
  console.log(`Total (discounts first, then ${TAX_RATE * 100}% tax): $${cart.getTotal()}`);

  console.log("\n-- checkout --");
  const order = cart.checkout(user);
  console.log(
    `Order placed for ${order.user.name}: $${order.totalAmount} ` +
      `[Order #${order.orderId}]`,
  );
  console.log(`Apples left in stock: ${apple.getStock()}`); // 10 - 5 = 5
}

main();
