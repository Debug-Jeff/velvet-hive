const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST /api/orders
// Body: { name, email, address, items: [{ id, quantity, price }] }
router.post("/", async (req, res) => {
  const { name, email, address, items } = req.body;

  if (!name || !email || !address || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert the order
    const orderResult = await client.query(
      "INSERT INTO orders (customer_name, email, address, total) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, address, total.toFixed(2)],
    );
    const orderId = orderResult.rows[0].id;

    // Insert each order item
    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)",
        [orderId, item.id, item.quantity, item.price],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  } finally {
    client.release();
  }
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
