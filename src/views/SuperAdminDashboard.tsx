
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Activity, 
  LayoutDashboard, 
  Settings, 
  FileText, 
  UserSquare2, 
  BarChart3, 
  History,
  LogOut,
  Database,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Search
} from 'lucide-react';
import { Personnel, UserRole } from '../types';

interface SuperAdminDashboardProps {
  currentUser: Personnel;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = data?.activity?.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short' }),
    value: item.count
  })) || [
    { name: 'Sab', value: 10 },
    { name: 'Min', value: 10 },
    { name: 'Sen', value: 10 },
    { name: 'Sel', value: 10 },
    { name: 'Rab', value: 45 },
    { name: 'Kam', value: 15 },
  ];

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0e17] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0e17] text-slate-200 min-h-screen p-8 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Monitoring Panel - Pusat</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Dashboard Super Admin</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Cakupan Data: <span className="text-slate-300">Seluruh Jatim</span></p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Terhubung ke Database</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Users className="text-blue-400" size={20} />}
          label="TOTAL ANGGOTA"
          value={data?.stats?.totalUsers || "0"}
          subLabel="Seluruh Jatim"
          subColor="bg-blue-500/20 text-blue-400"
        />
        <StatCard 
          icon={<Clock className="text-orange-400" size={20} />}
          label="PERMINTAAN AKTIF"
          value={data?.stats?.pendingRequests || "0"}
          subLabel="Tindakan Diperlukan"
          subColor="bg-orange-500/20 text-orange-400"
        />
        <StatCard 
          icon={<CheckCircle className="text-emerald-400" size={20} />}
          label="TERSELESAIKAN"
          value={data?.stats?.approvedRequests || "0"}
          subLabel="Sistem Email"
          subColor="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard 
          icon={<Activity className="text-sky-400" size={20} />}
          label="HEALTH SYSTEM"
          value={`${data?.stats?.healthSystem || "100"}%`}
          subLabel="Stabil"
          subColor="bg-sky-500/20 text-sky-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111827] border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Grafik Aktivitas</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Statistik Permintaan di Seluruh Jatim</p>
              </div>
              <select className="bg-[#1f2937] border border-slate-700 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                <option>7 HARI</option>
                <option>30 HARI</option>
              </select>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4b5563', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Content Section */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-[#111827] border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-lg font-black text-white tracking-tight mb-2">Aksi Cepat</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Pintasan navigasi cepat berdasarkan hak akses Anda.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={<History size={18} />} label="PROSES REQUEST" />
              <QuickAction icon={<UserPlus size={18} />} label="KELOLA PERSONEL" />
              <QuickAction icon={<Settings size={18} />} label="PROFIL AKUN" />
              <QuickAction icon={<ShieldCheck size={18} />} label="AUDIT LOG" />
            </div>
          </div>

          {/* Latest Requests */}
          <div className="bg-[#111827] border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-lg font-black text-white tracking-tight mb-8">Permintaan Terbaru</h3>
            
            <div className="space-y-6">
              {data?.latestRequests?.map((req: any) => (
                <RequestItem 
                  key={req.id}
                  initials={req.nama.charAt(0)}
                  name={req.nama}
                  unit={req.kesatuan || 'POLRES MALANG'}
                  status={req.status === 'APPROVED' ? 'SELESAI' : 'BARU'}
                />
              )) || (
                <>
                  <RequestItem initials="t" name="testing10" unit="POLRES MALANG" status="SELESAI" />
                  <RequestItem initials="t" name="testing2" unit="POLRES MALANG" status="BARU" />
                  <RequestItem initials="B" name="Briptu Budi Santoso" unit="POLRESTABES SURABAYA" status="BARU" />
                  <RequestItem initials="T" name="Testing" unit="POLRES MALANG" status="SELESAI" />
                  <RequestItem initials="T" name="Testing" unit="POLRES MALANG" status="SELESAI" />
                </>
              )}
            </div>

            <button className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors">
              LIHAT SEMUA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subLabel, subColor }: any) => (
  <div className="bg-[#111827] border border-slate-800/50 rounded-3xl p-8 shadow-2xl transition-all hover:border-slate-700 group">
    <div className="bg-slate-800/50 w-10 h-10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
    <h4 className="text-4xl font-black text-white mb-4 tracking-tight">{value}</h4>
    <span className={`${subColor} text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider`}>
      {subLabel}
    </span>
  </div>
);

const QuickAction = ({ icon, label }: any) => (
  <button className="bg-[#1f2937]/50 border border-slate-800/50 hover:bg-blue-600 hover:border-blue-500 p-6 rounded-2xl flex flex-col items-start gap-4 transition-all group">
    <div className="text-slate-400 group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest text-left">
      {label}
    </span>
  </button>
);

const RequestItem = ({ initials, name, unit, status }: any) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 font-black uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
        {initials}
      </div>
      <div>
        <h5 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{name}</h5>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{unit}</p>
      </div>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'SELESAI' ? 'text-emerald-500' : 'text-orange-500'}`}>
      {status}
    </span>
  </div>
);

export default SuperAdminDashboard;
