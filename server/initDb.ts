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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nrp VARCHAR(20) NOT NULL UNIQUE,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role TEXT CHECK(role IN ('SUPERADMIN', 'ADMIN_POLRES', 'USER')) DEFAULT 'USER',
        polres_id INT,
        FOREIGN KEY (polres_id) REFERENCES m_polres(id)
      )
    `);

    // 3. Create t_logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS t_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INT,
        aktivitas VARCHAR(50) NOT NULL,
        keterangan TEXT,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES m_users(id)
      )
    `);

    // 4. Create t_reset_requests table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS t_reset_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INT,
        nama VARCHAR(100),
        nrp VARCHAR(20),
        pangkat VARCHAR(50),
        jabatan VARCHAR(100),
        kesatuan VARCHAR(100),
        kontak_person VARCHAR(50),
        prioritas VARCHAR(20) DEFAULT 'Normal',
        dokumen_kta TEXT,
        status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
        alasan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES m_users(id)
      )
    `);

    // 5. Check if table is empty for seeding
    const [rows]: any = await pool.execute("SELECT COUNT(*) as count FROM m_users");
    const userCount = rows[0].count;

    if (userCount === 0) {
      console.log("Seeding initial users...");
      
      const defaultPassword = "password123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Ensure polres exist for seeding
      await pool.execute("INSERT OR IGNORE INTO m_polres (id, nama) VALUES (1, 'POLDA JATIM'), (2, 'POLRES MALANG'), (3, 'POLRES SIDOARJO')");

      const initialUsers = [
        { nrp: '11111111', nama: 'Super Admin Polda', email: 'admin.polda@polri.go.id', role: 'SUPERADMIN', polres_id: 1 },
        { nrp: '22222222', nama: 'Admin Polres Malang', email: 'admin.malang@polri.go.id', role: 'ADMIN_POLRES', polres_id: 2 },
        { nrp: '33333333', nama: 'Admin Polres Sidoarjo', email: 'admin.sidoarjo@polri.go.id', role: 'ADMIN_POLRES', polres_id: 3 },
        { nrp: '44444444', nama: 'User Testing', email: 'testing@polri.go.id', role: 'USER', polres_id: 2 },
      ];

      for (const user of initialUsers) {
        await pool.execute(
          "INSERT INTO m_users (nrp, nama, email, password_hash, role, polres_id) VALUES (?, ?, ?, ?, ?, ?)",
          [user.nrp, user.nama, user.email, hashedPassword, user.role, user.polres_id]
        );
      }
      console.log("Seeding completed successfully.");
    }
 else {
      console.log("Database already has data, skipping seed.");
    }

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
