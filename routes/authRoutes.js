const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/pets');
  return res.render('login', { title: 'Admin Login' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    req.flash('success', 'Welcome back, admin.');
    return res.redirect('/pets');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Login failed. Please check the database connection.');
    return res.redirect('/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;