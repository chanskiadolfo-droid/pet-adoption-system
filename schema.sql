CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20) NOT NULL,
    description TEXT,
    adopter_name VARCHAR(100),
    adopter_contact VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
