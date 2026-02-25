import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mocking mysql2 pool interface using SQLite
class SQLitePool {
  private db: any = null;

  async init() {
    if (this.db) return;
    this.db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
    console.log("📂 Database: Menggunakan SQLite (File-based) untuk demo");
  }

  async execute(sql: string, params: any[] = []) {
    await this.init();
    // Convert MySQL specific syntax to SQLite if needed
    let sqliteSql = sql
      .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
      .replace(/ENUM\([^)]+\)/gi, 'TEXT')
      .replace(/LONGTEXT/gi, 'TEXT');


    // Handle INSERT IGNORE (SQLite uses INSERT OR IGNORE)
    if (sqliteSql.toUpperCase().includes('INSERT IGNORE')) {
      sqliteSql = sqliteSql.replace(/INSERT IGNORE/gi, 'INSERT OR IGNORE');
    }

    try {
      if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await this.db.all(sqliteSql, params);
        return [rows];
      } else {
        const result = await this.db.run(sqliteSql, params);
        return [{ insertId: result.lastID, affectedRows: result.changes }];
      }
    } catch (error) {
      console.error("❌ SQLite Error:", error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []) {
    return this.execute(sql, params);
  }
}

const pool = new SQLitePool();

export default pool;
