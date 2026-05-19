require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  let connection;

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT || 3306),
      multipleStatements: true
    });

    await connection.query(sql);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message || error.code || error);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();
