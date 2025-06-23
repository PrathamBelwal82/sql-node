const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());

console.log("Starting backend...");

require('dotenv').config();
console.log("DB Config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.post('/users', async (req, res) => {
  const { username, email, password, full_name } = req.body;

  try {
    // Unique email logic added in table only .
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, full_name)
       VALUES (?, ?, ?, ?)`,
      [username, email, password, full_name]
    );

    res.status(201).json({ message: 'User created', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'User insertion failed' });
  }
});

app.get('/users/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, full_name
       FROM users WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
