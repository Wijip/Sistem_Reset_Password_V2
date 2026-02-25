
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { Personnel, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  currentUser: Personnel;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, showToast }) => {
  const isSuperAdmin = currentUser.role === UserRole.SUPERADMIN;
  const isPolresAdmin = currentUser.role === UserRole.ADMIN_POLRES;
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          showToast?.('Gagal mengambil data dashboard', 'error');
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        showToast?.('Kesalahan koneksi database', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [showToast]);

  const labelContext = isSuperAdmin ? 'Seluruh Jatim' : `Polres ${currentUser.kesatuan}`;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sky-600 font-black text-xs uppercase tracking-[0.2em]">Monitoring Panel - {isSuperAdmin ? 'Pusat' : 'Polres'}</span>
          <h1 className={`text-3xl font-black tracking-tight mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard {isSuperAdmin ? 'Super Admin' : 'Admin Unit'}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Cakupan Data: <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-900'} font-bold`}>{labelContext}</span></p>
        </div>
        <div className={`px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Terhubung ke Database</span>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Anggota', value: stats?.total_personnel || 0, trend: labelContext, icon: 'groups', color: 'indigo', link: '/personnel' },
          { label: 'Permintaan Aktif', value: stats?.active_requests || 0, trend: 'Tindakan Diperlukan', icon: 'pending_actions', color: 'amber', link: '/requests' },
          { label: 'Terselesaikan', value: stats?.completed_requests || 0, trend: 'Sistem Email', icon: 'verified', color: 'emerald', link: '/requests' },
          { label: 'Health System', value: '100%', trend: 'Stabil', icon: 'speed', color: 'sky', link: '#' }
        ].map((stat, idx) => (
          <Link key={idx} to={stat.link} className={`rounded-[2rem] p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? `bg-${stat.color}-500/10` : `bg-${stat.color}-50`}`}>
              <span className={`material-symbols-outlined text-${stat.color}-600 text-4xl`}>{stat.icon}</span>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            <div className={`text-3xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
            <div className={`text-[10px] font-bold mt-2 inline-block px-2 py-1 rounded-lg ${isDarkMode ? `bg-${stat.color}-500/20 text-${stat.color}-400` : `bg-${stat.color}-50 text-${stat.color}-600`}`}>
              {stat.trend}
            </div>
          </Link>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 rounded-[2.5rem] p-8 shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Grafik Aktivitas</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Statistik Permintaan di {labelContext}</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chart_data || []}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-4 rounded-2xl shadow-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-black text-sky-500">{payload[0].value} Permintaan</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-2 relative z-10">Aksi Cepat</h3>
            <p className="text-slate-400 text-xs font-medium mb-8 relative z-10">Pintasan navigasi cepat berdasarkan hak akses Anda.</p>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <Link to="/requests" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <span className="material-symbols-outlined text-sky-400 mb-3 group-hover:scale-110 transition-transform text-3xl">lock_reset</span>
                <div className="text-[10px] font-black uppercase tracking-tighter">Proses Request</div>
              </Link>
              {isSuperAdmin && (
                <Link to="/personnel" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                  <span className="material-symbols-outlined text-emerald-400 mb-3 group-hover:scale-110 transition-transform text-3xl">manage_accounts</span>
                  <div className="text-[10px] font-black uppercase tracking-tighter">Kelola Personel</div>
                </Link>
              )}
              <Link to="/settings" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <span className="material-symbols-outlined text-orange-400 mb-3 group-hover:scale-110 transition-transform text-3xl">tune</span>
                <div className="text-[10px] font-black uppercase tracking-tighter">Profil Akun</div>
              </Link>
              {isSuperAdmin && (
                <Link to="/logs" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                  <span className="material-symbols-outlined text-indigo-400 mb-3 group-hover:scale-110 transition-transform text-3xl">security</span>
                  <div className="text-[10px] font-black uppercase tracking-tighter">Audit Log</div>
                </Link>
              )}
            </div>
          </div>

          <div className={`rounded-[2.5rem] p-8 shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
            <h3 className={`font-black text-lg mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Informasi Sistem</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <span className="material-symbols-outlined">database</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Status Database</div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase">Online & Sinkron</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Keamanan Sesi</div>
                  <div className="text-[10px] text-sky-500 font-bold uppercase">Terproteksi JWT</div>
                </div>
              </div>
              <Link to="/requests" className="block text-center text-[10px] font-black text-sky-600 uppercase tracking-widest pt-4 hover:underline">Lihat Semua Aktivitas</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;

export default Dashboard;
