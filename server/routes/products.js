const express = require('express');
const router = express.Router();
const pool = require('../db');

function adminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const SELECT = 'SELECT id, name, price::float, category, image_url AS image, description FROM products';

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `${SELECT} ORDER BY id`;
    let params = [];
    if (category && category !== 'All') {
      query = `${SELECT} WHERE category = $1 ORDER BY id`;
      params = [category];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, price, category, image_url, description } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'name, price and category are required' });
    }
    const result = await pool.query(
      `INSERT INTO products (name, price, category, image_url, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, price::float, category, image_url AS image, description`,
      [name.trim(), parseFloat(price), category, image_url || '', description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, image_url, description } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'name, price and category are required' });
    }
    const result = await pool.query(
      `UPDATE products
       SET name=$1, price=$2, category=$3, image_url=$4, description=$5
       WHERE id=$6
       RETURNING id, name, price::float, category, image_url AS image, description`,
      [name.trim(), parseFloat(price), category, image_url || '', description || '', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
