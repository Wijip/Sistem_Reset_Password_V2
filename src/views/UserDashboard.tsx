
import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Personnel, ResetRequest, RequestStatus } from '../types';

interface UserDashboardProps {
  currentUser: Personnel;
  requests: ResetRequest[];
  setRequests?: React.Dispatch<React.SetStateAction<ResetRequest[]>>;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  addNotification?: (title: string, body: string, type: 'request' | 'system' | 'personnel', refId?: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  currentUser, 
  requests, 
  setRequests, 
  showToast,
  addNotification 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua status');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ResetRequest | null>(null);
  const [showPasswordInDetail, setShowPasswordInDetail] = useState(false);
  
  // Form State
  const [formNama, setFormNama] = useState('');
  const [formPangkat, setFormPangkat] = useState('');
  const [formNRP, setFormNRP] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formKontak, setFormKontak] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const alasan = 'Lupa Password'; 

  // Helper Label Status
  const getStatusLabel = (status: RequestStatus) => {
    if (status === RequestStatus.MENUNGGU) return 'TERKIRIM';
    if (status === RequestStatus.DIPROSES) return 'DI PROSES';
    if (status === RequestStatus.SELESAI) return 'SELESAI';
    return status;
  };

  // Auto-fill form
  useEffect(() => {
    if (isModalOpen) {
      setFormNama(currentUser.nama || '');
      setFormPangkat(currentUser.pangkat || '');
      setFormNRP(currentUser.nrp || '');
      setFormJabatan(currentUser.jabatan || '');
      setFormKontak(currentUser.telepon || '');
      setKeterangan('');
    }
  }, [isModalOpen, currentUser]);

  const myRequests = useMemo(() => {
    return requests.filter(r => {
      const userNrp = (currentUser.nrp || '').trim();
      const reqNrp = (r.nrp || '').trim();
      const userUnit = (currentUser.kesatuan || '').trim();
      const reqUnit = (r.kesatuan || '').trim();

      const isMine = reqNrp === userNrp || (reqUnit === userUnit && userUnit !== '');
      
      const matchesSearch = 
        (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.nrp || '').includes(searchTerm);
      
      const matchesStatus = statusFilter === 'Semua status' || getStatusLabel(r.status) === statusFilter.toUpperCase();
      
      return isMine && matchesSearch && matchesStatus;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [requests, currentUser, searchTerm, statusFilter]);

  const handleAjukanReset = () => {
    if (!formNama.trim() || !formNRP.trim()) {
      showToast?.('Nama dan NRP wajib diisi', 'error');
      return;
    }

    const requestId = `REQ-${Math.floor(1000 + Math.random() * 8999)}`;
    const newRequest: ResetRequest = {
      id: requestId,
      nama: formNama,
      pangkat: formPangkat,
      nrp: formNRP,
      jabatan: formJabatan,
      kesatuan: currentUser.kesatuan,
      kontak_person: formKontak,
      waktu_iso: new Date().toISOString(),
      status: RequestStatus.MENUNGGU,
      alasan: alasan,
      catatan: keterangan,
      createdAt: Date.now()
    };

    if (setRequests) {
      setRequests(prev => [newRequest, ...prev]);
      addNotification?.('Permintaan Reset Baru', `Personel ${formNama} mengajukan reset.`, 'request', requestId);
      showToast?.('Permintaan reset password berhasil dikirim');
      setIsModalOpen(false);
    }
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-full mx-auto bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER SECTION - Match Screenshot */}
      <div className="bg-white rounded-xl p-5 flex items-center justify-between shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-2xl">shield</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Sistem Reset Password</h1>
            <p className="text-xs text-slate-400 font-medium">Polda Jatim — Dashboard Personel</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.hash = '/login'}
          className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>

      {/* ACTION CARD - Match Screenshot */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
           <span className="material-symbols-outlined text-blue-600">badge</span>
           <h2 className="text-sm font-bold text-slate-800">Ajukan Permintaan Reset</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          Gunakan tombol di bawah untuk mengajukan permintaan reset password akun dinas. <br/>
          Jika Anda lupa password atau akun terkunci, ajukan permintaan reset melalui tombol berikut.
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-3 transition-all flex-1 md:flex-none"
          >
            <span className="material-symbols-outlined text-xl">send</span>
            Ajukan Reset Password
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">
             <span className="material-symbols-outlined text-xl">help</span>
             Bantuan
          </button>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">Setelah pengajuan dikirim, Anda akan menerima notifikasi pada halaman ini ketika status berubah.</p>
      </div>

      {/* RIWAYAT PENGAJUAN TABLE - Match Screenshot Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-blue-600">history</span>
             <div>
                <h3 className="text-sm font-bold text-slate-800">Riwayat Pengajuan</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Semua pengajuan reset password untuk unit Anda</p>
             </div>
          </div>

          {/* TABLE TOOLBAR - Match Screenshot */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Cari ID, nama, NRP..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Semua status</option>
              <option>Terkirim</option>
              <option>Di Proses</option>
              <option>Selesai</option>
            </select>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Segarkan</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
               <span className="material-symbols-outlined text-lg">table_view</span>
               Export Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
               <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
               Export PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
               <span className="material-symbols-outlined text-lg">upload</span>
               Import
            </button>
          </div>
        </div>

        {/* DATA TABLE - Extended to match all columns in screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/30 border-y border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">ID Tiket</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Nama</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Pangkat</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">NRP</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Jabatan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Kesatuan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Kontak Person</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Alasan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-800 uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myRequests.map((req) => (
                <tr 
                  key={req.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedDetail(req); setShowPasswordInDetail(false); }}
                >
                  <td className="px-6 py-5 text-xs font-bold text-slate-600 text-center">
                    {new Date(req.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-700 font-mono">{req.id}</span>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-800 text-center uppercase">{req.nama}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 text-center uppercase">{req.pangkat}</td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600 text-center font-mono">{req.nrp}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 text-center uppercase">{req.jabatan}</td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600 text-center uppercase">{req.kesatuan}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 text-center">{req.kontak_person || '-'}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 text-center">{req.alasan}</td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500 text-center max-w-[200px] truncate italic">
                    {req.catatan || '-'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      req.status === RequestStatus.MENUNGGU ? 'bg-amber-50 text-amber-600' :
                      req.status === RequestStatus.DIPROSES ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <p className="text-xs font-medium text-slate-400">Belum ada pengajuan untuk unit Anda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL - Same logic as before but updated look */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Rincian Pengajuan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ID TIKET: {selectedDetail.id}</p>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <span className="text-xs font-bold text-blue-600">{getStatusLabel(selectedDetail.status)}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal</p>
                  <span className="text-xs font-bold text-slate-800">{new Date(selectedDetail.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedDetail.status === RequestStatus.SELESAI && (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                     <span className="material-symbols-outlined text-xl">key</span>
                     <p className="text-[10px] font-black uppercase tracking-widest">Password Baru Anda</p>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPasswordInDetail ? "text" : "password"} 
                      readOnly
                      className="w-full bg-white border border-emerald-200 px-5 py-3 rounded-xl text-lg font-mono font-black tracking-widest text-emerald-800"
                      value={selectedDetail.reset_password || ''}
                    />
                    <button onClick={() => setShowPasswordInDetail(!showPasswordInDetail)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">
                      <span className="material-symbols-outlined">{showPasswordInDetail ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Kontak Person</p>
                    <p className="text-xs font-bold text-slate-800">{selectedDetail.kontak_person || '-'}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 mb-2">Catatan Admin</p>
                    <p className="text-xs font-bold text-slate-700 italic">"{selectedDetail.catatan || 'Tidak ada catatan tambahan.'}"</p>
                 </div>
              </div>

              <button onClick={() => setSelectedDetail(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL - Updated to include Contact Person */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="material-symbols-outlined text-blue-600">edit_document</span>
                <h3 className="text-base font-bold text-slate-800">Form Pengajuan Reset Password</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Konfirmasi Identitas</p>
                    <p className="text-sm font-bold text-slate-700">{currentUser.nama} / {currentUser.nrp}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1">{currentUser.kesatuan}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kontak Person (WhatsApp)</label>
                       <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                          placeholder="Contoh: 08123456789"
                          value={formKontak}
                          onChange={(e) => setFormKontak(e.target.value)}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alasan</label>
                       <input 
                          type="text" 
                          readOnly
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500 outline-none"
                          value={alasan}
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Keterangan / Kendala (Opsional)</label>
                    <textarea 
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500/10"
                       placeholder="Masukkan kendala spesifik..."
                       value={keterangan}
                       onChange={(e) => setKeterangan(e.target.value)}
                    />
                 </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50">Batal</button>
                 <button onClick={handleAjukanReset} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 shadow-lg shadow-blue-100">Kirim Pengajuan</button>
              </div>
           </div>
        </div>
      )}

    </main>
  );
};

export default UserDashboard;
