
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Personnel, 
  ResetRequest, 
  SiteSettings, 
  Notification, 
  UserRole,
  RequestStatus,
  LogEntry
} from './types';
import { INITIAL_PERSONNEL, INITIAL_REQUESTS, INITIAL_LOGS } from './constants';
import Dashboard from './views/Dashboard';
import ResetRequests from './views/ResetRequests';
import PersonnelData from './views/PersonnelData';
import Reports from './views/Reports';
import Logs from './views/Logs';
import Settings from './views/Settings';
import Login from './views/Login';
import UserDashboard from './views/UserDashboard';
import PublicResetForm from './views/PublicResetForm';
import Sidebar from './components/Sidebar';
import MobileTopbar from './components/MobileTopbar';
import Toast from './components/Toast';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ 
  currentUser: Personnel | null, 
  superAdminOnly?: boolean,
  anyAdminOnly?: boolean
}>> = ({ children, currentUser, superAdminOnly = false, anyAdminOnly = false }) => {
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (superAdminOnly && currentUser.role !== UserRole.SUPERADMIN) return <Navigate to="/" replace />;
  
  if (anyAdminOnly && currentUser.role === UserRole.USER) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('PERSONNEL_DATA');
    return saved ? JSON.parse(saved) : INITIAL_PERSONNEL;
  });

  const [requests, setRequests] = useState<ResetRequest[]>(() => {
    const saved = localStorage.getItem('RESET_REQUESTS');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('SYSTEM_LOGS');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('SITE_SETTINGS');
    return saved ? JSON.parse(saved) : { 
      name: 'Polda Jatim', 
      logo: '/img/BIDTIK.webp',
      loginTitle: 'Reset Password Email Polri',
      loginSubtitle: 'Bid Tik Polda Jatim',
      darkMode: false
    };
  });

  useEffect(() => {
    if (siteSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [siteSettings.darkMode]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<Personnel | null>(() => {
    const saved = localStorage.getItem('session_personel');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error'}[]>([]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('session_personel', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('session_personel');
    }
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [currentUser, token]);

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          const [reqsRes] = await Promise.all([
            fetch('/api/requests', { headers: { 'Authorization': `Bearer ${token}` } }),
          ]);
          if (reqsRes.ok) {
            const data = await reqsRes.json();
            setRequests(data.map((r: any) => ({
              id: r.id.toString(),
              nama: r.user.nama,
              pangkat: "Bripda", // Mocked as it's not in the requested schema but needed for UI
              nrp: r.user.nrp,
              jabatan: "Anggota",
              kesatuan: r.user.polres?.nama || 'POLDA JATIM',
              waktu_iso: r.created_at,
              status: r.status === 'PENDING' ? RequestStatus.MENUNGGU : r.status === 'APPROVED' ? RequestStatus.SELESAI : RequestStatus.DITOLAK,
              alasan: r.alasan,
              dokumen_kta: r.dokumen_kta,
              prioritas: r.prioritas,
              createdAt: new Date(r.created_at).getTime()
            })));
          }
        } catch (error) {
          console.error("Failed to sync data with backend", error);
        }
      };
      fetchData();
    }
  }, [token]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const addLog = useCallback((aktivitas: LogEntry['aktivitas'], keterangan: string) => {
    if (!currentUser) return;
    const newLog: LogEntry = {
      id: `L-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      waktu: Date.now(),
      user: {
        nama: currentUser.nama,
        role: currentUser.role === UserRole.SUPERADMIN ? 'Super Admin' : currentUser.role === UserRole.ADMIN ? 'Admin Polres' : 'Personel',
        initials: currentUser.nama.split(' ').map(n => n[0]).join('').toUpperCase()
      },
      aktivitas,
      keterangan,
      ipAddress: '10.12.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)
    };
    setLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  const handleLoginSuccess = (user: Personnel, token: string) => {
    setCurrentUser(user);
    setToken(token);
    addLog('Login', 'Pengguna berhasil login ke sistem');
  };

  const handleLogout = () => {
    addLog('Sistem', 'Pengguna melakukan logout dari sistem');
    setCurrentUser(null);
    setToken(null);
  };

  const addNotification = (title: string, body: string, type: 'request' | 'system' | 'personnel', refId?: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      time: Date.now(),
      read: false,
      type,
      refId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const submitPublicRequest = (nrp: string, alasan: string, dokumen_kta?: string, prioritas?: any) => {
    const person = personnel.find(p => p.nrp === nrp);
    if (!person) return { success: false, message: 'NRP tidak terdaftar dalam sistem.' };

    const newRequest: ResetRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: person.nama,
      pangkat: person.pangkat,
      nrp: person.nrp,
      jabatan: person.jabatan,
      kesatuan: person.kesatuan,
      waktu_iso: new Date().toISOString(),
      status: RequestStatus.MENUNGGU,
      alasan: alasan,
      dokumen_kta,
      prioritas: prioritas || 'Normal',
      createdAt: Date.now()
    };

    setRequests(prev => [newRequest, ...prev]);
    addNotification('Permintaan Baru', `Pengajuan reset password dari NRP ${nrp}`, 'request', newRequest.id);
    return { success: true, message: 'Permintaan Anda telah dikirim ke Admin.' };
  };

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${siteSettings.darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        {currentUser && (
          <>
            <Sidebar 
              siteSettings={siteSettings} 
              currentUser={currentUser} 
              onLogout={handleLogout} 
            />
            <MobileTopbar siteSettings={siteSettings} notifications={notifications} />
          </>
        )}

        <div className={`flex-1 flex flex-col min-w-0 ${currentUser ? 'pt-14 md:pt-0' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLoginSuccess} siteSettings={siteSettings} />} />
            <Route path="/request-reset" element={<PublicResetForm onSubmit={submitPublicRequest} siteSettings={siteSettings} />} />
            
            <Route path="/" element={
              <ProtectedRoute currentUser={currentUser}>
                {currentUser?.role === UserRole.SUPERADMIN || currentUser?.role === UserRole.ADMIN || currentUser?.role === 'ADMIN_POLDA' ? (
                  <Dashboard showToast={showToast} currentUser={currentUser!} />
                ) : (
                  <UserDashboard 
                    currentUser={currentUser!} 
                    requests={requests} 
                    setRequests={setRequests}
                    showToast={showToast}
                    addNotification={addNotification}
                  />
                )}
              </ProtectedRoute>
            } />
            
            <Route path="/requests" element={
              <ProtectedRoute anyAdminOnly currentUser={currentUser}>
                <ResetRequests 
                  requests={requests} 
                  setRequests={setRequests} 
                  showToast={showToast}
                  addNotification={addNotification}
                  addLog={addLog}
                  siteSettings={siteSettings}
                  currentUser={currentUser as Personnel}
                />
              </ProtectedRoute>
            } />
            
            <Route path="/personnel" element={
              <ProtectedRoute superAdminOnly currentUser={currentUser}>
                <PersonnelData 
                  personnel={personnel} 
                  setPersonnel={setPersonnel} 
                  showToast={showToast}
                  addLog={addLog}
                />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute superAdminOnly currentUser={currentUser}>
                <Reports requests={requests} showToast={showToast} />
              </ProtectedRoute>
            } />

            <Route path="/logs" element={
              <ProtectedRoute superAdminOnly currentUser={currentUser}>
                <Logs logs={logs} showToast={showToast} />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute currentUser={currentUser}>
                <Settings 
                  siteSettings={siteSettings} 
                  setSiteSettings={setSiteSettings} 
                  currentUser={currentUser as Personnel}
                  setCurrentUser={setCurrentUser}
                  showToast={showToast}
                  addLog={addLog}
                />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none print:hidden">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} />
          ))}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
