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

// --- Helpers ---
const createLog = async (userId: number | null, aktivitas: string, keterangan: string, ip: string = '0.0.0.0') => {
  try {
    await pool.execute(
      'INSERT INTO t_logs (user_id, aktivitas, keterangan, ip_address) VALUES (?, ?, ?, ?)',
      [userId, aktivitas, keterangan, ip]
    );
  } catch (error) {
    console.error("Gagal membuat log:", error);
  }
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
        polres_id: user.polres_id,
        kesatuan: user.polres_nama || 'POLDA JATIM'
      }
    });

    await createLog(user.id, 'LOGIN', `User ${user.nama} berhasil login`, req.ip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Submit Reset Request
app.post("/api/requests", async (req, res) => {
  const { nrp, nama, pangkat, jabatan, kesatuan, kontak_person, alasan, dokumen_kta, prioritas } = req.body;
  try {
    // Find user by NRP to link if exists
    const [userRows]: any = await pool.execute('SELECT id FROM m_users WHERE nrp = ?', [nrp]);
    const userId = userRows[0]?.id || null;

    await pool.execute(
      'INSERT INTO t_reset_requests (user_id, nama, nrp, pangkat, jabatan, kesatuan, kontak_person, alasan, dokumen_kta, prioritas, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nama, nrp, pangkat, jabatan, kesatuan, kontak_person, alasan, dokumen_kta, prioritas || "Normal", "PENDING"]
    );

    if (userId) {
      await createLog(userId, 'REQUEST', `Mengajukan permintaan reset password`, req.ip);
    }

    res.status(201).json({ success: true, message: "Permintaan berhasil dikirim" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengirim permintaan" });
  }
});

// Get Stats (for Dashboard)
app.get("/api/stats", authenticateToken, async (req: any, res) => {
  try {
    const isPolda = req.user.role === 'ADMIN_POLDA';
    const polresId = req.user.polres_id;

    let totalRequestsQuery = 'SELECT COUNT(*) as totalRequests FROM t_reset_requests';
    let pendingRequestsQuery = 'SELECT COUNT(*) as pendingRequests FROM t_reset_requests WHERE status = "PENDING"';
    let approvedRequestsQuery = 'SELECT COUNT(*) as approvedRequests FROM t_reset_requests WHERE status = "APPROVED"';
    let totalUsersQuery = 'SELECT COUNT(*) as totalUsers FROM m_users';
    let params: any[] = [];

    if (!isPolda) {
      totalRequestsQuery += ' r JOIN m_users u ON r.user_id = u.id WHERE u.polres_id = ?';
      pendingRequestsQuery += ' r JOIN m_users u ON r.user_id = u.id WHERE r.status = "PENDING" AND u.polres_id = ?';
      approvedRequestsQuery += ' r JOIN m_users u ON r.user_id = u.id WHERE r.status = "APPROVED" AND u.polres_id = ?';
      totalUsersQuery += ' WHERE polres_id = ?';
      params = [polresId];
    }

    const [[{ totalRequests }]]: any = await pool.execute(totalRequestsQuery, params);
    const [[{ pendingRequests }]]: any = await pool.execute(pendingRequestsQuery, params);
    const [[{ approvedRequests }]]: any = await pool.execute(approvedRequestsQuery, params);
    const [[{ totalUsers }]]: any = await pool.execute(totalUsersQuery, params);

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      totalUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil statistik" });
  }
});

// Get Requests
app.get("/api/requests", authenticateToken, async (req: any, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SUPERADMIN';
    const polresId = req.user.polres_id;

    let query = `
      SELECT r.*, 
             COALESCE(r.nama, u.nama) as nama, 
             COALESCE(r.nrp, u.nrp) as nrp, 
             COALESCE(r.kesatuan, p.nama) as kesatuan 
      FROM t_reset_requests r
      LEFT JOIN m_users u ON r.user_id = u.id
      LEFT JOIN m_polres p ON u.polres_id = p.id
    `;
    
    let params: any[] = [];
    if (!isSuperAdmin) {
      query += ' WHERE u.polres_id = ? OR r.kesatuan LIKE ?';
      // This is a bit loose, but for demo it works. 
      // In real app we'd use polres_id for requests too.
      params = [polresId, `%${req.user.kesatuan}%` || ''];
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const [requests] = await pool.execute(query, params);
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

// Update Request Status
app.patch("/api/requests/:id", authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.execute('UPDATE t_reset_requests SET status = ? WHERE id = ?', [status, id]);
    
    const [reqRows]: any = await pool.execute('SELECT user_id, nama FROM t_reset_requests WHERE id = ?', [id]);
    const request = reqRows[0];
    
    await createLog(req.user.id, status, `Mengubah status permintaan ${request?.nama || id} menjadi ${status}`, req.ip);

    res.json({ success: true, message: "Status berhasil diperbarui" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui status" });
  }
});

// Get Dashboard Stats
app.get("/api/dashboard-stats", authenticateToken, async (req: any, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SUPERADMIN';
    const polresId = req.user.polres_id;

    let totalPersonnelQuery = 'SELECT COUNT(*) as count FROM m_users';
    let activeRequestsQuery = 'SELECT COUNT(*) as count FROM t_reset_requests WHERE status = "PENDING"';
    let completedRequestsQuery = 'SELECT COUNT(*) as count FROM t_reset_requests WHERE status = "APPROVED"';
    let params: any[] = [];

    if (!isSuperAdmin) {
      totalPersonnelQuery += ' WHERE polres_id = ?';
      activeRequestsQuery = 'SELECT COUNT(*) as count FROM t_reset_requests r JOIN m_users u ON r.user_id = u.id WHERE r.status = "PENDING" AND u.polres_id = ?';
      completedRequestsQuery = 'SELECT COUNT(*) as count FROM t_reset_requests r JOIN m_users u ON r.user_id = u.id WHERE r.status = "APPROVED" AND u.polres_id = ?';
      params = [polresId];
    }

    const [[{ count: totalPersonnel }]]: any = await pool.execute(totalPersonnelQuery, params);
    const [[{ count: activeRequests }]]: any = await pool.execute(activeRequestsQuery, params);
    const [[{ count: completedRequests }]]: any = await pool.execute(completedRequestsQuery, params);

    // Mock chart data for now
    const chartData = [
      { name: 'Sen', value: 12 },
      { name: 'Sel', value: 19 },
      { name: 'Rab', value: 15 },
      { name: 'Kam', value: 22 },
      { name: 'Jum', value: 30 },
      { name: 'Sab', value: 10 },
      { name: 'Min', value: 5 },
    ];

    res.json({
      total_personnel: totalPersonnel,
      active_requests: activeRequests,
      completed_requests: completedRequests,
      chart_data: chartData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil statistik dashboard" });
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
