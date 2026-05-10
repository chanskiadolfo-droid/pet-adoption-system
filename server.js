require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.redirect('/pets');
});

app.get('/pets', async (req, res) => {
  try {
    const search = req.query.search || '';

    const result = await pool.query(
      `SELECT * FROM pets
       WHERE name ILIKE $1
       OR type ILIKE $1
       OR breed ILIKE $1
       OR status ILIKE $1
       ORDER BY id ASC`,
      [`%${search}%`]
    );

    res.render('index', {
      pets: result.rows,
      search
    });
  } catch (error) {
    res.status(500).send('Database error: ' + error.message);
  }
});

app.get('/pets/create', (req, res) => {
  res.render('create');
});

app.post('/pets', async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      age,
      gender,
      description
    } = req.body;

    await pool.query(
      `INSERT INTO pets
       (name, type, breed, age, gender, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Available')`,
      [name, type, breed, age || null, gender, description]
    );

    res.redirect('/pets');
  } catch (error) {
    res.status(500).send('Create error: ' + error.message);
  }
});

app.get('/pets/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pets WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Pet not found');
    }

    res.render('show', {
      pet: result.rows[0]
    });
  } catch (error) {
    res.status(500).send('Show error: ' + error.message);
  }
});

app.get('/pets/:id/edit', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pets WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Pet not found');
    }

    res.render('edit', {
      pet: result.rows[0]
    });
  } catch (error) {
    res.status(500).send('Edit error: ' + error.message);
  }
});

app.put('/pets/:id', async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      age,
      gender,
      description,
      status,
      adopter_name,
      adopter_contact
    } = req.body;

    await pool.query(
      `UPDATE pets
       SET name = $1,
           type = $2,
           breed = $3,
           age = $4,
           gender = $5,
           description = $6,
           status = $7,
           adopter_name = $8,
           adopter_contact = $9
       WHERE id = $10`,
      [
        name,
        type,
        breed,
        age || null,
        gender,
        description,
        status,
        adopter_name || null,
        adopter_contact || null,
        req.params.id
      ]
    );

    res.redirect('/pets');
  } catch (error) {
    res.status(500).send('Update error: ' + error.message);
  }
});

app.post('/pets/:id/adopt', async (req, res) => {
  try {
    const { adopter_name, adopter_contact } = req.body;

    await pool.query(
      `UPDATE pets
       SET status = 'Adopted',
           adopter_name = $1,
           adopter_contact = $2
       WHERE id = $3`,
      [adopter_name, adopter_contact, req.params.id]
    );

    res.redirect('/pets/' + req.params.id);
  } catch (error) {
    res.status(500).send('Adoption error: ' + error.message);
  }
});

app.post('/pets/:id/available', async (req, res) => {
  try {
    await pool.query(
      `UPDATE pets
       SET status = 'Available',
           adopter_name = NULL,
           adopter_contact = NULL
       WHERE id = $1`,
      [req.params.id]
    );

    res.redirect('/pets/' + req.params.id);
  } catch (error) {
    res.status(500).send('Status error: ' + error.message);
  }
});

app.delete('/pets/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM pets WHERE id = $1',
      [req.params.id]
    );

    res.redirect('/pets');
  } catch (error) {
    res.status(500).send('Delete error: ' + error.message);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pet Adoption System running on port ${PORT}`);
});
