import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mem-parsing DATABASE_URL (URI) menjadi objek konfigurasi mysql2
 * Format: mysql://user:password@host:port/database
 */
const parseDatabaseUrl = (url: string) => {
  try {
    const pattern = /^mysql:\/\/([^:]+):?([^@]*?)@([^:]+):?(\d*)\/(.+)$/;
    const match = url.match(pattern);
    
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]) || 3306,
        database: match[5]
      };
    }
  } catch (e) {
    console.error("Gagal mem-parsing DATABASE_URL:", e);
  }
  return null;
};

let config: any = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DATABASE_URL) {
  const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
  if (parsed) {
    console.log("📡 Database: Menggunakan koneksi dari DATABASE_URL (ENV)");
    config = { ...config, ...parsed };
  } else {
    console.log("⚠️ Database: DATABASE_URL ditemukan tapi format tidak valid, mencoba fallback...");
    config = {
      ...config,
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'polda_reset_db'
    };
  }
} else {
  console.log("🏠 Database: DATABASE_URL tidak ditemukan, menggunakan konfigurasi fallback XAMPP");
  config = {
    ...config,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'polda_reset_db'
  };
}

const pool = mysql.createPool(config);

export default pool;
