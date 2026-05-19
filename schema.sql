CREATE DATABASE IF NOT EXISTS pet_adoption_system;
USE pet_adoption_system;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(60) NOT NULL,
  breed VARCHAR(100),
  age INT,
  gender ENUM('Male', 'Female', 'Unknown') NOT NULL DEFAULT 'Unknown',
  description TEXT,
  adoption_status ENUM('Available', 'Adopted') NOT NULL DEFAULT 'Available',
  adopted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO admins (name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@example.com',
  '$2a$10$JrLIjyGjoeyjzCDpcYQ6ZOM6uJJ.WAw17cayLoDwQbcDKfGGNpb4a',
  'Admin'
)
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO pets (name, type, breed, age, gender, description, adoption_status)
VALUES
  ('Buddy', 'Dog', 'Golden Retriever', 3, 'Male', 'Friendly and active dog.', 'Available'),
  ('Mittens', 'Cat', 'Persian', 2, 'Female', 'Calm indoor cat.', 'Available'),
  ('Lucky', 'Dog', 'Mixed Breed', 4, 'Male', 'Already adopted by a local family.', 'Adopted');