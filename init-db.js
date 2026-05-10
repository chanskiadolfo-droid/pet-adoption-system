const fs = require('fs');
const { pool } = require('./db');

async function initDatabase() {
  try {
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await pool.query(sql);
    console.log('Database table created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDatabase();
