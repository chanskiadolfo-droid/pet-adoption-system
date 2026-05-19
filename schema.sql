CREATE DATABASE IF NOT EXISTS pet_adoption_system;
USE pet_adoption_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(60) NOT NULL,
  breed VARCHAR(100),
  age INT,
  gender ENUM('Male', 'Female') NOT NULL,
  size ENUM('Small', 'Medium', 'Large') NOT NULL DEFAULT 'Medium',
  color VARCHAR(80),
  health_status VARCHAR(150),
  description TEXT,
  status ENUM('Available', 'Adopted') NOT NULL DEFAULT 'Available',
  adopter_name VARCHAR(100),
  adopter_contact VARCHAR(100),
  adoption_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role)
VALUES
  ('admin', 'admin123', 'admin'),
  ('staff', 'staff123', 'staff')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role);

INSERT INTO pets
  (name, species, breed, age, gender, size, color, health_status, description, status)
SELECT 'Buddy', 'Dog', 'Golden Retriever', 3, 'Male', 'Large', 'Golden', 'Vaccinated and healthy', 'Friendly, active, and trained for basic commands.', 'Available'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Buddy' AND species = 'Dog');

INSERT INTO pets
  (name, species, breed, age, gender, size, color, health_status, description, status)
SELECT 'Mittens', 'Cat', 'Domestic Shorthair', 2, 'Female', 'Small', 'Gray and white', 'Spayed and vaccinated', 'Calm indoor cat that enjoys quiet spaces.', 'Available'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Mittens' AND species = 'Cat');

INSERT INTO pets
  (name, species, breed, age, gender, size, color, health_status, description, status)
SELECT 'Luna', 'Dog', 'Aspin', 1, 'Female', 'Medium', 'Brown', 'Recently dewormed', 'Gentle rescued puppy ready for a caring home.', 'Available'
WHERE NOT EXISTS (SELECT 1 FROM pets WHERE name = 'Luna' AND species = 'Dog');
