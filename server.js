require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const session = require('express-session');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'pet-adoption-secret',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/login');
}

function requireStaffOrAdmin(req, res, next) {
  if (req.session.user && ['admin', 'staff'].includes(req.session.user.role)) {
    return next();
  }
  return res.status(403).send('Access denied. Admin or staff account required.');
}

function requireAdmin(req, res, next) {
  if (req.session.user?.role === 'admin') return next();
  return res.status(403).send('Admin access required.');
}

async function getDashboardStats() {
  const [[totalRows], [availableRows], [adoptedRows], [recentPets]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS count FROM pets'),
    pool.query("SELECT COUNT(*) AS count FROM pets WHERE status = 'Available'"),
    pool.query("SELECT COUNT(*) AS count FROM pets WHERE status = 'Adopted'"),
    pool.query('SELECT * FROM pets ORDER BY created_at DESC LIMIT 5')
  ]);

  return {
    totalPets: totalRows[0].count,
    availablePets: availableRows[0].count,
    adoptedPets: adoptedRows[0].count,
    recentPets
  };
}

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user || user.password !== password) {
      return res.status(401).render('login', { error: 'Invalid username or password.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Login failed. Check your XAMPP MySQL connection.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.render('dashboard', { user: req.session.user, stats });
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to load dashboard.');
  }
});

app.get('/pets', requireLogin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const values = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR species LIKE ? OR breed LIKE ? OR color LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && ['Available', 'Adopted'].includes(status)) {
      conditions.push('status = ?');
      values.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [pets] = await pool.query(
      `SELECT * FROM pets ${whereClause} ORDER BY created_at DESC, id DESC`,
      values
    );

    res.render('index', {
      pets,
      user: req.session.user,
      search,
      status
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to load pet records.');
  }
});

app.get('/pets/create', requireStaffOrAdmin, (req, res) => {
  res.render('create', { user: req.session.user });
});

app.post('/pets', requireStaffOrAdmin, async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      age,
      gender,
      size,
      color,
      health_status,
      description
    } = req.body;

    await pool.query(
      `INSERT INTO pets
        (name, species, breed, age, gender, size, color, health_status, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
      [
        name,
        species,
        breed || null,
        age || null,
        gender,
        size || 'Medium',
        color || null,
        health_status || null,
        description || null
      ]
    );

    res.redirect('/pets');
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to add pet.');
  }
});

app.get('/pets/:id', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    const pet = rows[0];

    if (!pet) return res.status(404).send('Pet record not found.');

    res.render('show', { pet, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to view pet.');
  }
});

app.get('/pets/:id/edit', requireStaffOrAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    const pet = rows[0];

    if (!pet) return res.status(404).send('Pet record not found.');

    res.render('edit', { pet, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to load edit form.');
  }
});

app.put('/pets/:id', requireStaffOrAdmin, async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      age,
      gender,
      size,
      color,
      health_status,
      description,
      status,
      adopter_name,
      adopter_contact,
      adoption_date
    } = req.body;

    const adopterName = status === 'Adopted' ? adopter_name || null : null;
    const adopterContact = status === 'Adopted' ? adopter_contact || null : null;
    const adoptionDate = status === 'Adopted' ? adoption_date || new Date().toISOString().slice(0, 10) : null;

    await pool.query(
      `UPDATE pets
       SET name = ?,
           species = ?,
           breed = ?,
           age = ?,
           gender = ?,
           size = ?,
           color = ?,
           health_status = ?,
           description = ?,
           status = ?,
           adopter_name = ?,
           adopter_contact = ?,
           adoption_date = ?
       WHERE id = ?`,
      [
        name,
        species,
        breed || null,
        age || null,
        gender,
        size || 'Medium',
        color || null,
        health_status || null,
        description || null,
        status,
        adopterName,
        adopterContact,
        adoptionDate,
        req.params.id
      ]
    );

    res.redirect(`/pets/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to update pet.');
  }
});

app.post('/pets/:id/adopt', requireStaffOrAdmin, async (req, res) => {
  try {
    const { adopter_name, adopter_contact } = req.body;

    await pool.query(
      `UPDATE pets
       SET status = 'Adopted',
           adopter_name = ?,
           adopter_contact = ?,
           adoption_date = CURDATE()
       WHERE id = ?`,
      [adopter_name, adopter_contact, req.params.id]
    );

    res.redirect(`/pets/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to mark pet as adopted.');
  }
});

app.post('/pets/:id/available', requireStaffOrAdmin, async (req, res) => {
  try {
    await pool.query(
      `UPDATE pets
       SET status = 'Available',
           adopter_name = NULL,
           adopter_contact = NULL,
           adoption_date = NULL
       WHERE id = ?`,
      [req.params.id]
    );

    res.redirect(`/pets/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to mark pet as available.');
  }
});

app.delete('/pets/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM pets WHERE id = ?', [req.params.id]);
    res.redirect('/pets');
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to delete pet.');
  }
});

app.listen(PORT, () => {
  console.log(`Pet Adoption System running at http://localhost:${PORT}`);
});
