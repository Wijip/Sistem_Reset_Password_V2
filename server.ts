import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "polda-jatim-secret-key";

app.use(cors());
app.use(express.json({ limit: '50mb' }));

import { Request, Response, NextFunction } from "express";

// --- Middleware ---
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user.role !== 'ADMIN_POLDA') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// --- API Routes ---

// Auth
app.post("/api/login", async (req: Request, res: Response) => {
  const { nrp, password } = req.body;
  try {
    const user = await prisma.m_users.findUnique({
      where: { nrp },
      include: { polres: true }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, nrp: user.nrp, role: user.role, polres_id: user.polres_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nrp: user.nrp,
        nama: user.nama,
        role: user.role,
        kesatuan: user.polres?.nama || 'POLDA JATIM'
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Requests
app.post("/api/requests", async (req: Request, res: Response) => {
  const { nrp, alasan, dokumen_kta, prioritas } = req.body;
  try {
    const user = await prisma.m_users.findUnique({ where: { nrp } });
    if (!user) return res.status(404).json({ message: "NRP tidak terdaftar" });

    const newRequest = await prisma.t_reset_requests.create({
      data: {
        user_id: user.id,
        alasan,
        dokumen_kta,
        prioritas: prioritas || "Normal",
        status: "PENDING"
      }
    });

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengirim permintaan" });
  }
});

app.get("/api/requests", authenticateToken, async (req: any, res: Response) => {
  try {
    const whereClause = req.user.role === 'ADMIN_POLDA' ? {} : { user_id: req.user.id };
    const requests = await prisma.t_reset_requests.findMany({
      where: whereClause,
      include: {
        user: {
          include: { polres: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

app.patch("/api/requests/:id", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.t_reset_requests.update({
      where: { id: parseInt(id as string) },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Gagal update status" });
  }
});

// Stats for Dashboard
app.get("/api/stats", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const totalRequests = await prisma.t_reset_requests.count();
    const pendingRequests = await prisma.t_reset_requests.count({ where: { status: 'PENDING' } });
    const approvedRequests = await prisma.t_reset_requests.count({ where: { status: 'APPROVED' } });
    const totalUsers = await prisma.m_users.count();

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

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
