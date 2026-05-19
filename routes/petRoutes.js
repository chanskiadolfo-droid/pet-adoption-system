const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const status = req.query.status || 'all';
  const search = req.query.search || '';

  const conditions = [];
  const params = [];

  if (status !== 'all') {
    params.push(status);
    conditions.push(`adoption_status = $${params.length}`);
  }

  if (search.trim()) {
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    const searchStart = params.length - 2;
    conditions.push(`(name ILIKE $${searchStart} OR type ILIKE $${searchStart + 1} OR breed ILIKE $${searchStart + 2})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const petsResult = await db.query(
    `SELECT * FROM pets ${whereClause} ORDER BY created_at DESC`,
    params
  );

  const summaryResult = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE adoption_status = 'Available') AS available,
      COUNT(*) FILTER (WHERE adoption_status = 'Adopted') AS adopted
    FROM pets
  `);

  res.render('pets/index', {
    title: 'Pet Records',
    pets: petsResult.rows,
    summary: summaryResult.rows[0],
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

  await db.query(
    `INSERT INTO pets (name, type, breed, age, gender, description, adoption_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [name, type, breed, age || null, gender, description, adoption_status || 'Available']
  );

  req.flash('success', 'Pet record added successfully.');
  res.redirect('/pets');
});

router.get('/:id/edit', async (req, res) => {
  const result = await db.query('SELECT * FROM pets WHERE id = $1', [req.params.id]);
  const pet = result.rows[0];

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

  await db.query(
    `UPDATE pets
     SET name = $1, type = $2, breed = $3, age = $4, gender = $5, description = $6, adoption_status = $7
     WHERE id = $8`,
    [name, type, breed, age || null, gender, description, adoption_status, req.params.id]
  );

  req.flash('success', 'Pet record updated successfully.');
  res.redirect('/pets');
});

router.post('/:id/adopt', async (req, res) => {
  await db.query(
    `UPDATE pets
     SET adoption_status = 'Adopted', adopted_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [req.params.id]
  );

  req.flash('success', 'Pet marked as adopted.');
  res.redirect('/pets');
});

router.post('/:id/available', async (req, res) => {
  await db.query(
    `UPDATE pets
     SET adoption_status = 'Available', adopted_at = NULL
     WHERE id = $1`,
    [req.params.id]
  );

  req.flash('success', 'Pet marked as available.');
  res.redirect('/pets');
});

router.post('/:id/delete', async (req, res) => {
  await db.query('DELETE FROM pets WHERE id = $1', [req.params.id]);
  req.flash('success', 'Pet record deleted successfully.');
  res.redirect('/pets');
});

module.exports = router;
