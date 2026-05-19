const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const status = req.query.status || 'all';
  const search = req.query.search || '';

  const conditions = [];
  const params = [];

  if (status !== 'all') {
    conditions.push('adoption_status = ?');
    params.push(status);
  }

  if (search.trim()) {
    conditions.push('(name LIKE ? OR type LIKE ? OR breed LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [pets] = await db.execute(
    `SELECT * FROM pets ${whereClause} ORDER BY created_at DESC`,
    params
  );

  const [[summary]] = await db.execute(`
    SELECT
      COUNT(*) AS total,
      SUM(adoption_status = 'Available') AS available,
      SUM(adoption_status = 'Adopted') AS adopted
    FROM pets
  `);

  res.render('pets/index', {
    title: 'Pet Records',
    pets,
    summary,
    filters: { status, search }
  });
});

router.get('/new', (req, res) => {
  res.render('pets/form', {
    title: 'Add Pet',
    pet: {},
    action: '/pets',
    submitLabel: 'Add Pet'
  });
});

router.post('/', async (req, res) => {
  const { name, type, breed, age, gender, description, adoption_status } = req.body;

  await db.execute(
    `INSERT INTO pets (name, type, breed, age, gender, description, adoption_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, type, breed, age || null, gender, description, adoption_status || 'Available']
  );

  req.flash('success', 'Pet record added successfully.');
  res.redirect('/pets');
});

router.get('/:id/edit', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM pets WHERE id = ?', [req.params.id]);
  const pet = rows[0];

  if (!pet) {
    req.flash('error', 'Pet record not found.');
    return res.redirect('/pets');
  }

  return res.render('pets/form', {
    title: 'Edit Pet',
    pet,
    action: `/pets/${pet.id}/update`,
    submitLabel: 'Update Pet'
  });
});

router.post('/:id/update', async (req, res) => {
  const { name, type, breed, age, gender, description, adoption_status } = req.body;

  await db.execute(
    `UPDATE pets
     SET name = ?, type = ?, breed = ?, age = ?, gender = ?, description = ?, adoption_status = ?
     WHERE id = ?`,
    [name, type, breed, age || null, gender, description, adoption_status, req.params.id]
  );

  req.flash('success', 'Pet record updated successfully.');
  res.redirect('/pets');
});

router.post('/:id/adopt', async (req, res) => {
  await db.execute(
    `UPDATE pets
     SET adoption_status = 'Adopted', adopted_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [req.params.id]
  );

  req.flash('success', 'Pet marked as adopted.');
  res.redirect('/pets');
});

router.post('/:id/available', async (req, res) => {
  await db.execute(
    `UPDATE pets
     SET adoption_status = 'Available', adopted_at = NULL
     WHERE id = ?`,
    [req.params.id]
  );

  req.flash('success', 'Pet marked as available.');
  res.redirect('/pets');
});

router.post('/:id/delete', async (req, res) => {
  await db.execute('DELETE FROM pets WHERE id = ?', [req.params.id]);
  req.flash('success', 'Pet record deleted successfully.');
  res.redirect('/pets');
});

module.exports = router;