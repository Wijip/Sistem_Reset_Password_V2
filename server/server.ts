import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";
import { initDatabase } from "./initDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "polda-jatim-secret-key";

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await pool.execute(
      'SELECT u.*, p.nama as polres_nama FROM m_users u LEFT JOIN m_polres p ON u.polres_id = p.id WHERE u.email = ?',
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user.id, nrp: user.nrp, email: user.email, role: user.role, polres_id: user.polres_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nrp: user.nrp,
        nama: user.nama,
        email: user.email,
        role: user.role,
        kesatuan: user.polres_nama || 'POLDA JATIM'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Submit Reset Request
app.post("/api/reset-request", async (req, res) => {
  const { nrp, alasan, dokumen_kta, prioritas } = req.body;
  try {
    // Find user by NRP
    const [userRows]: any = await pool.execute('SELECT id FROM m_users WHERE nrp = ?', [nrp]);
    const user = userRows[0];
    
    if (!user) return res.status(404).json({ message: "NRP tidak terdaftar" });

    await pool.execute(
      'INSERT INTO t_reset_requests (user_id, alasan, dokumen_kta, prioritas, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [user.id, alasan, dokumen_kta, prioritas || "Normal", "PENDING"]
    );

    res.status(201).json({ success: true, message: "Permintaan berhasil dikirim" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengirim permintaan" });
  }
});

// Get Stats (for Dashboard)
app.get("/api/stats", authenticateToken, async (req: any, res) => {
  try {
    const [[{ totalRequests }]]: any = await pool.execute('SELECT COUNT(*) as totalRequests FROM t_reset_requests');
    const [[{ pendingRequests }]]: any = await pool.execute('SELECT COUNT(*) as pendingRequests FROM t_reset_requests WHERE status = "PENDING"');
    const [[{ approvedRequests }]]: any = await pool.execute('SELECT COUNT(*) as approvedRequests FROM t_reset_requests WHERE status = "APPROVED"');
    const [[{ totalUsers }]]: any = await pool.execute('SELECT COUNT(*) as totalUsers FROM m_users');

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik" });
  }
});

// Get Requests
app.get("/api/requests", authenticateToken, async (req: any, res) => {
  try {
    let query = `
      SELECT r.*, u.nama, u.nrp, p.nama as kesatuan 
      FROM t_reset_requests r
      JOIN m_users u ON r.user_id = u.id
      LEFT JOIN m_polres p ON u.polres_id = p.id
      ORDER BY r.created_at DESC
    `;
    const [requests] = await pool.execute(query);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

// Get Admin Stats (for Super Admin Dashboard)
app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'ADMIN_POLDA' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: "Akses ditolak" });
  }

  try {
    const [[{ totalUsers }]]: any = await pool.execute('SELECT COUNT(*) as totalUsers FROM m_users');
    const [[{ pendingRequests }]]: any = await pool.execute('SELECT COUNT(*) as pendingRequests FROM t_reset_requests WHERE status = "PENDING"');
    const [[{ approvedRequests }]]: any = await pool.execute('SELECT COUNT(*) as approvedRequests FROM t_reset_requests WHERE status = "APPROVED"');
    
    // Activity Graph (last 7 days)
    const [activityRows]: any = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM t_reset_requests 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Latest 5 requests
    const [latestRequests]: any = await pool.execute(`
      SELECT r.*, u.nama, u.nrp, p.nama as kesatuan 
      FROM t_reset_requests r
      JOIN m_users u ON r.user_id = u.id
      LEFT JOIN m_polres p ON u.polres_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: {
        totalUsers,
        pendingRequests,
        approvedRequests,
        healthSystem: 100 // Mocked as 100%
      },
      activity: activityRows,
      latestRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil statistik admin" });
  }
});

// --- Vite Integration ---
async function startServer() {
  // Initialize database schema and seed data
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
