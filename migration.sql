-- Instruksi Migrasi SQL untuk phpMyAdmin (XAMPP)
-- Buat database baru bernama 'polda_reset_db'

CREATE DATABASE IF NOT EXISTS polda_reset_db;
USE polda_reset_db;

-- Tabel m_polres
CREATE TABLE IF NOT EXISTS m_polres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE
);

-- Tabel m_users
CREATE TABLE IF NOT EXISTS m_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nrp VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN_POLDA', 'USER_POLRES') DEFAULT 'USER_POLRES',
    polres_id INT,
    FOREIGN KEY (polres_id) REFERENCES m_polres(id)
);

-- Tabel t_reset_requests
CREATE TABLE IF NOT EXISTS t_reset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    alasan TEXT NOT NULL,
    dokumen_kta LONGTEXT,
    prioritas VARCHAR(20) DEFAULT 'Normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expired_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES m_users(id)
);

-- Data Awal (Opsional)
INSERT INTO m_polres (nama) VALUES ('POLDA JATIM'), ('POLRES SURABAYA'), ('POLRES MALANG');

-- Password default: 'password123' (sudah di-hash menggunakan bcrypt)
-- NRP: 12345678
INSERT INTO m_users (nrp, nama, email, password_hash, role, polres_id) 
VALUES ('12345678', 'Admin Polda', 'admin@poldajatim.go.id', '$2a$10$x6XmX/X6XmX/X6XmX/X6X.X6XmX/X6XmX/X6XmX/X6XmX/X6XmX/X', 'ADMIN_POLDA', 1);
