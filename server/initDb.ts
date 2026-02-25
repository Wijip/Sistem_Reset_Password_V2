import bcrypt from "bcryptjs";
import pool from "./db.js";

export const initDatabase = async () => {
  try {
    console.log("Checking database tables...");

    // 1. Create m_polres table first (needed for foreign key if we use it, 
    // but the prompt only specifically asked for m_users structure)
    // However, to be safe and consistent with previous migration, let's ensure it exists.
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS m_polres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // 2. Create m_users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS m_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nrp VARCHAR(20) NOT NULL UNIQUE,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('ADMIN_POLDA', 'USER_POLRES') DEFAULT 'USER_POLRES',
        polres_id INT,
        FOREIGN KEY (polres_id) REFERENCES m_polres(id)
      )
    `);

    // 3. Check if table is empty for seeding
    const [rows]: any = await pool.execute("SELECT COUNT(*) as count FROM m_users");
    const userCount = rows[0].count;

    if (userCount === 0) {
      console.log("Seeding initial users...");
      
      const defaultPassword = "password123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Ensure at least one polres exists for seeding
      await pool.execute("INSERT IGNORE INTO m_polres (id, nama) VALUES (1, 'POLDA JATIM')");

      const initialUsers = [
        { nrp: '11111111', nama: 'Super Admin 1', email: 'superadmin1@polri.go.id', role: 'ADMIN_POLDA' },
        { nrp: '22222222', nama: 'Super Admin 2', email: 'superadmin2@polri.go.id', role: 'ADMIN_POLDA' },
        { nrp: '33333333', nama: 'Admin Malang', email: 'admin.malang@polri.go.id', role: 'ADMIN_POLDA' },
        { nrp: '44444444', nama: 'Admin Sidoarjo', email: 'admin.sidoarjo@polri.go.id', role: 'ADMIN_POLDA' },
        { nrp: '55555555', nama: 'User Testing', email: 'testing@polri.go.id', role: 'USER_POLRES' },
      ];

      for (const user of initialUsers) {
        await pool.execute(
          "INSERT INTO m_users (nrp, nama, email, password_hash, role, polres_id) VALUES (?, ?, ?, ?, ?, ?)",
          [user.nrp, user.nama, user.email, hashedPassword, user.role, 1]
        );
      }
      console.log("Seeding completed successfully.");
    } else {
      console.log("Database already has data, skipping seed.");
    }

    // 4. Create t_reset_requests table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS t_reset_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        alasan TEXT NOT NULL,
        dokumen_kta LONGTEXT,
        prioritas VARCHAR(20) DEFAULT 'Normal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES m_users(id)
      )
    `);

    console.log("Database initialization finished.");
  } catch (error: any) {
    console.error("\n❌ ERROR DATABASE CONNECTION:");
    console.error("--------------------------------------------------");
    console.error(`Pesan Error: ${error.message}`);
    console.error("--------------------------------------------------");
    console.error("INSTRUKSI PERBAIKAN:");
    console.error("1. Pastikan MySQL di XAMPP (Control Panel) sudah START.");
    console.error("2. Cek apakah database 'polda_reset_db' sudah dibuat di phpMyAdmin.");
    console.error("3. Jika menggunakan password, pastikan .env sudah dikonfigurasi.");
    console.error("4. Cek apakah user 'root' memiliki akses ke localhost.");
    console.error("--------------------------------------------------\n");
    
    // Jangan throw agar server tetap bisa jalan (untuk debugging)
  }
};
