const express = require('express');
const pool = require('./db');
const bcrypt = require('bcrypt'); // 🔐 added
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

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Username, email, and password all are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 🔐 hash the password

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, full_name)
       VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name]
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

app.put('/users/update', async (req, res) => {
  const { username, password, email, new_password, full_name } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // 🔐 Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (new_password) {
      const hashedNewPassword = await bcrypt.hash(new_password, 10); // 🔐 rehash
      updates.push('password = ?');
      values.push(hashedNewPassword);
    }
    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE email = ?`;
    values.push(email);

    await pool.query(updateQuery, values);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
