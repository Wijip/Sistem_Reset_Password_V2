
import { RequestStatus, UserRole } from './types';

export const mockData = {
  "personnel": [
    // --- SUPER ADMIN (POLDA JATIM) ---
    {
      "id": "SA1",
      "nama": "AKBP Budiono",
      "pangkat": "AKBP",
      "nrp": "78010001",
      "jabatan": "Kabid Tik",
      "kesatuan": "Polda Jatim",
      "email": "superadmin1@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLDA,
      "passwordPlain": "superadmin123"
    },
    {
      "id": "SA2",
      "nama": "Kompol Siti Aminah",
      "pangkat": "Kompol",
      "nrp": "82050002",
      "jabatan": "Kasubag Tekinfo",
      "kesatuan": "Polda Jatim",
      "email": "superadmin2@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLDA,
      "passwordPlain": "siperadmin123"
    },

    // --- USER TESTING KHUSUS ---
    {
      "id": "USR_TEST",
      "nama": "Testing Personel",
      "pangkat": "Brigadir",
      "nrp": "99999999",
      "jabatan": "User Testing",
      "kesatuan": "Polres Malang",
      "email": "testing@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user!1234"
    },

    // --- ADMIN & USER: POLRES MALANG ---
    {
      "id": "ADM_MLG",
      "nama": "Iptu Eko Prasetyo",
      "pangkat": "Iptu",
      "nrp": "88120005",
      "jabatan": "Kasi Tik Polres Malang",
      "kesatuan": "Polres Malang",
      "email": "admin.malang@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminmalang123"
    },
    {
      "id": "USR_MLG",
      "nama": "Andi Saputra",
      "pangkat": "Briptu",
      "nrp": "95120345",
      "jabatan": "Penyidik Pembantu",
      "kesatuan": "Polres Malang",
      "email": "andi.saputra@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRES SIDOARJO ---
    {
      "id": "ADM_SDA",
      "nama": "Bripka Agus",
      "pangkat": "Bripka",
      "nrp": "92010009",
      "jabatan": "Admin Tik Polres Sidoarjo",
      "kesatuan": "Polres Sidoarjo",
      "email": "admin.sidoarjo@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminsidoarjo123"
    },
    {
      "id": "USR_SDA",
      "nama": "Bripda Adi Wijaya",
      "pangkat": "Bripda",
      "nrp": "99051022",
      "jabatan": "Banit Lantas",
      "kesatuan": "Polres Sidoarjo",
      "email": "adi.wijaya@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRESTABES SURABAYA ---
    {
      "id": "ADM_SBY",
      "nama": "Iptu Lukman Hakim",
      "pangkat": "Iptu",
      "nrp": "85031122",
      "jabatan": "Kasi Tik Polrestabes Surabaya",
      "kesatuan": "Polrestabes Surabaya",
      "email": "admin.surabaya@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminsurabaya123"
    },
    {
      "id": "USR_SBY",
      "nama": "Briptu Budi Santoso",
      "pangkat": "Briptu",
      "nrp": "96020441",
      "jabatan": "Banit Reskrim",
      "kesatuan": "Polrestabes Surabaya",
      "email": "budi.s@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRES GRESIK ---
    {
      "id": "ADM_GSK",
      "nama": "Ipda Sari Putri",
      "pangkat": "Ipda",
      "nrp": "89070554",
      "jabatan": "Kasi Tik Polres Gresik",
      "kesatuan": "Polres Gresik",
      "email": "admin.gresik@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "admingresik123"
    },
    {
      "id": "USR_GSK",
      "nama": "Brigadir Nina Septia",
      "pangkat": "Brigadir",
      "nrp": "93080112",
      "jabatan": "Bamin Ops",
      "kesatuan": "Polres Gresik",
      "email": "nina.s@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRES MOJOKERTO ---
    {
      "id": "ADM_MJK",
      "nama": "Aiptu Slamet Riadi",
      "pangkat": "Aiptu",
      "nrp": "77100332",
      "jabatan": "Ps. Kasi Tik Polres Mojokerto",
      "kesatuan": "Polres Mojokerto",
      "email": "admin.mojokerto@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminmojokerto123"
    },
    {
      "id": "USR_MJK",
      "nama": "Bripda Rizky Ramadhan",
      "pangkat": "Bripda",
      "nrp": "01010556",
      "jabatan": "Banit Intelkam",
      "kesatuan": "Polres Mojokerto",
      "email": "rizky.r@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRES PASURUAN ---
    {
      "id": "ADM_PSR",
      "nama": "Bripka Deni Setiawan",
      "pangkat": "Bripka",
      "nrp": "91120887",
      "jabatan": "Admin Tik Polres Pasuruan",
      "kesatuan": "Polres Pasuruan",
      "email": "admin.pasuruan@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminpasuruan123"
    },
    {
      "id": "USR_PSR",
      "nama": "Briptu Maya Indah",
      "pangkat": "Briptu",
      "nrp": "97040223",
      "jabatan": "Bamin SPKT",
      "kesatuan": "Polres Pasuruan",
      "email": "maya.indah@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    },

    // --- ADMIN & USER: POLRES KEDIRI ---
    {
      "id": "ADM_KDR",
      "nama": "Iptu Linda Wahyuni",
      "pangkat": "Iptu",
      "nrp": "86060443",
      "jabatan": "Kasi Tik Polres Kediri",
      "kesatuan": "Polres Kediri",
      "email": "admin.kediri@polri.go.id",
      "status": "Aktif",
      "role": UserRole.ADMIN_POLRES,
      "passwordPlain": "adminkediri123"
    },
    {
      "id": "USR_KDR",
      "nama": "Brigadir Sony Kurniawan",
      "pangkat": "Brigadir",
      "nrp": "94020998",
      "jabatan": "Banit Sabhara",
      "kesatuan": "Polres Kediri",
      "email": "sony.k@polri.go.id",
      "status": "Aktif",
      "role": UserRole.USER,
      "passwordPlain": "user123"
    }
  ],
  "requests": [
    {
      "id": "REQ-1001",
      "nama": "Testing Personel",
      "pangkat": "Brigadir",
      "nrp": "99999999",
      "jabatan": "User Testing",
      "kesatuan": "Polres Malang",
      "waktu_iso": "2024-02-21T08:00:00.000Z",
      "status": RequestStatus.MENUNGGU,
      "alasan": "Lupa Password",
      "catatan": "Percobaan reset password user testing.",
      "createdAt": Date.now() - 3600000
    },
    {
      "id": "REQ-1002",
      "nama": "Andi Saputra",
      "pangkat": "Briptu",
      "nrp": "95120345",
      "jabatan": "Penyidik Pembantu",
      "kesatuan": "Polres Malang",
      "waktu_iso": "2024-02-21T09:15:00.000Z",
      "status": RequestStatus.MENUNGGU,
      "alasan": "Lupa Password",
      "catatan": "Email dinas tidak bisa login sejak pagi.",
      "createdAt": Date.now() - 1800000
    }
  ],
  "logs": [
    {
      "id": "L1",
      "waktu": Date.now(),
      "user": { "nama": "AKBP Budiono", "role": "Super Admin", "initials": "AB" },
      "aktivitas": "Sistem",
      "keterangan": "Sistem diinisialisasi dengan struktur data terbaru Jatim.",
      "ipAddress": "10.12.1.1"
    }
  ],
  "systemActivities": [
    { "id": 1, "text": "Struktur 7 Admin Polres Jatim diaktifkan.", "time": "Baru saja", "type": "success" }
  ]
};
