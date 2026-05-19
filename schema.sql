DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(60) NOT NULL,
  breed VARCHAR(100),
  age INT,
  gender VARCHAR(20) NOT NULL DEFAULT 'Unknown',
  description TEXT,
  adoption_status VARCHAR(20) NOT NULL DEFAULT 'Available',
  adopted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (name, email, password_hash, role)
VALUES
  (
    'Unilyle',
    'unilyle@gmail.com',
    '$2a$10$En5mg1FYehfJd.Xu8.fmJ.QfLzL2SreJ.mJqpgX0BFtgzVa/Lk65a',
    'Admin'
  ),
  (
    'Yani',
    'yani@gmail.com',
    '$2a$10$6gVP.lX5QvBmCpf7NHOTzeNrnasdip27C3v8Fqz0/EfQGu2fVHska',
    'Staff'
  ),
  (
    'Rovel',
    'rovel@gmail.com',
    '$2a$10$as9fnc2aQft3Kn1CvPBqKOEMZhuhujeqTqQcQDd7OfivLs8Du41zi',
    'Adopter'
  );

INSERT INTO pets (name, type, breed, age, gender, description, adoption_status)
VALUES
  ('Buddy', 'Dog', 'Golden Retriever', 3, 'Male', 'Friendly and active dog.', 'Available'),
  ('Mittens', 'Cat', 'Persian', 2, 'Female', 'Calm indoor cat.', 'Available'),
  ('Lucky', 'Dog', 'Mixed Breed', 4, 'Male', 'Already adopted by a local family.', 'Adopted');