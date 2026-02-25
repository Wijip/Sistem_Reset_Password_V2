
import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Personnel, UserRole, LogEntry } from '../types';

interface PersonnelDataProps {
  personnel: Personnel[];
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  addLog?: (aktivitas: LogEntry['aktivitas'], keterangan: string) => void;
}

const PersonnelData: React.FC<PersonnelDataProps> = ({ personnel, setPersonnel, showToast, addLog }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Sync debounced search to active search for "automatic" feel, but allow manual trigger
  useEffect(() => {
    setActiveSearch(debouncedSearch);
  }, [debouncedSearch]);

  // Initial form state - Kosong untuk data baru (hanya placeholder)
  const initialForm: Partial<Personnel> = {
    nama: '',
    nrp: '',
    pangkat: '',
    jabatan: '',
    kesatuan: '',
    email: '',
    role: UserRole.USER,
    status: 'Aktif'
  };

  const [formData, setFormData] = useState<Partial<Personnel>>(initialForm);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterKesatuan, setFilterKesatuan] = useState<string>('ALL');

  // State untuk Custom Delete/Deactivate Flow
  const [actionTarget, setActionTarget] = useState<Personnel | null>(null);
  const [actionStep, setActionStep] = useState<'choice' | 'confirm'>('choice');
  const [actionType, setActionType] = useState<'delete' | 'deactivate' | null>(null);

  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);

  const kesatuanList = useMemo(() => {
    const list = Array.from(new Set(personnel.map(p => p.kesatuan))).sort();
    return list;
  }, [personnel]);

  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const search = activeSearch.toLowerCase().trim();
      const matchesSearch = search === '' || 
                           p.nama.toLowerCase().includes(search) ||
                           p.nrp.includes(search) ||
                           p.kesatuan.toLowerCase().includes(search);
      const matchesRole = filterRole === 'ALL' || p.role === filterRole;
      const matchesKesatuan = filterKesatuan === 'ALL' || p.kesatuan === filterKesatuan;
      
      return matchesSearch && matchesRole && matchesKesatuan;
    });
  }, [personnel, activeSearch, filterRole, filterKesatuan]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setFilterRole('ALL');
    setFilterKesatuan('ALL');
    setSelectedPersonnel(null);
  };

  const handleManualSearch = () => {
    setActiveSearch(searchTerm);
  };

  const handleEdit = (p: Personnel) => {
    setEditingId(p.id);
    setFormData(p);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const person = personnel.find(p => p.id === id);
    if (person) {
      setActionTarget(person);
      setActionStep('choice');
      setActionType(null);
    }
  };

  const executeAction = () => {
    if (!actionTarget || !actionType) return;

    if (actionType === 'delete') {
      setPersonnel(prev => prev.filter(p => p.id !== actionTarget.id));
      showToast('Data personel berhasil dihapus.');
      addLog?.('Hapus Data', `Menghapus data personel: ${actionTarget.nama} (NRP: ${actionTarget.nrp})`);
    } else {
      setPersonnel(prev => prev.map(p => p.id === actionTarget.id ? { ...p, status: 'Nonaktif' } : p));
      showToast('Status personel berhasil diubah menjadi Nonaktif.');
      addLog?.('Update Data', `Menonaktifkan personel: ${actionTarget.nama} (NRP: ${actionTarget.nrp})`);
    }

    setActionTarget(null);
    setActionType(null);
    setActionStep('choice');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nrp) return showToast('Nama dan NRP wajib diisi', 'error');

    const trimmedNrp = formData.nrp.trim();
    const isNrpExists = personnel.some(p => p.nrp === trimmedNrp && p.id !== editingId);
    if (isNrpExists) {
      return showToast(`NRP ${trimmedNrp} sudah terdaftar dalam sistem`, 'error');
    }

    if (editingId) {
      const sanitizedData = {
        ...formData,
        nama: formData.nama?.trim(),
        nrp: formData.nrp?.trim(),
        pangkat: formData.pangkat?.trim(),
        jabatan: formData.jabatan?.trim(),
        kesatuan: formData.kesatuan?.trim(),
        email: formData.email?.trim()
      };
      setPersonnel(prev => prev.map(p => p.id === editingId ? { ...p, ...sanitizedData as Personnel } : p));
      showToast('Data berhasil diperbarui');
      addLog?.('Update Data', `Memperbarui data personel: ${formData.nama} (NRP: ${formData.nrp})`);
    } else {
      const defaultPassword = formData.role === UserRole.ADMIN_POLDA ? 'superadmin!123' : formData.role === UserRole.ADMIN_POLRES ? 'admin!1234' : 'user!1234';
      
      const newPerson: Personnel = {
        ...(formData as Personnel),
        nama: formData.nama?.trim() || '',
        nrp: formData.nrp?.trim() || '',
        pangkat: formData.pangkat?.trim() || '',
        jabatan: formData.jabatan?.trim() || '',
        kesatuan: formData.kesatuan?.trim() || '',
        email: formData.email?.trim() || '',
        id: `P-${Date.now()}`,
        passwordPlain: defaultPassword
      };
      
      setPersonnel(prev => [newPerson, ...prev]);
      showToast(`Personel baru ditambahkan. Password default: ${defaultPassword}`);
      addLog?.('Update Data', `Menambahkan personel baru: ${newPerson.nama} (NRP: ${newPerson.nrp})`);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  return (
    <main className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Manajemen Personel & Role</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola data seluruh personel dan penetapan admin kesatuan.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }}
          className="bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Tambah Personel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={`transition-all duration-300 ${selectedPersonnel ? 'lg:w-2/3 w-full' : 'w-full'}`}>
          <div className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full max-w-2xl">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Cari nama, NRP, atau kesatuan..." 
                    className={`w-full pl-12 pr-6 py-3.5 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-sky-500/10 font-bold text-sm transition-all ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleManualSearch}
                    className="bg-sky-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-700 transition-all active:scale-95 shadow-lg shadow-sky-200/20"
                  >
                    Cari
                  </button>
                  <button 
                    onClick={handleResetFilters}
                    className={`px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-2 ${
                      isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                    title="Reset Filter"
                  >
                    <span className="material-symbols-outlined text-lg">restart_alt</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role:</span>
                  <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="ALL">Semua Role</option>
                    <option value={UserRole.ADMIN_POLDA}>Super Admin</option>
                    <option value={UserRole.ADMIN_POLRES}>Admin Unit</option>
                    <option value={UserRole.USER}>User</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit:</span>
                  <select 
                    value={filterKesatuan}
                    onChange={(e) => setFilterKesatuan(e.target.value)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="ALL">Semua Unit</option>
                    {kesatuanList.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-nowrap">
                <thead>
                  <tr className={`font-bold text-[11px] uppercase tracking-widest border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/50 text-slate-500 border-slate-800' : 'bg-slate-50/50 text-slate-400 border-slate-100'}`}>
                    <th className="px-6 py-4">Nama Personel</th>
                    <th className="px-6 py-4">Pangkat / NRP</th>
                    <th className="px-6 py-4">Role / Kesatuan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors duration-300 ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {filteredPersonnel.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPersonnel(p)}
                      className={`transition-colors group cursor-pointer ${
                        selectedPersonnel?.id === p.id 
                          ? (isDarkMode ? 'bg-sky-500/10' : 'bg-sky-50') 
                          : (isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/40')
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                            {p.nama.charAt(0)}
                          </div>
                          <div className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{p.nama}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{p.pangkat}</div>
                        <div className="text-xs text-slate-400 font-medium">{p.nrp}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            p.role === UserRole.ADMIN_POLDA ? (isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600') : 
                            p.role === UserRole.ADMIN_POLRES ? (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {p.role}
                          </span>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.kesatuan}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          p.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${p.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10' : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'}`}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                          >
                            <span className="material-symbols-outlined text-lg">block</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPersonnel.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Data tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedPersonnel && (
          <div className="lg:w-1/3 w-full animate-scale-in sticky top-8">
            <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Detail Personel</div>
                  <button 
                    onClick={() => setSelectedPersonnel(null)}
                    className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl ${isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                    {selectedPersonnel.nama.charAt(0)}
                  </div>
                  <div>
                    <h2 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedPersonnel.nama}</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{selectedPersonnel.pangkat} — {selectedPersonnel.nrp}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedPersonnel.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {selectedPersonnel.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className={`p-5 rounded-3xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jabatan & Kesatuan</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedPersonnel.jabatan}</div>
                    <div className="text-xs text-sky-600 font-black uppercase tracking-tight mt-1">{selectedPersonnel.kesatuan}</div>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email / Kontak</div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedPersonnel.email || '-'}</div>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hak Akses (Role)</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        selectedPersonnel.role === UserRole.ADMIN_POLDA ? 'bg-rose-500 text-white' : 
                        selectedPersonnel.role === UserRole.ADMIN_POLRES ? 'bg-indigo-500 text-white' : 'bg-slate-500 text-white'
                      }`}>
                        {selectedPersonnel.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => handleEdit(selectedPersonnel)}
                    className="flex-1 py-4 bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-lg shadow-sky-200/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Data
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedPersonnel.id)}
                    className={`p-4 rounded-2xl font-black transition-all active:scale-95 border-2 ${
                      isDarkMode ? 'border-slate-800 text-rose-500 hover:bg-rose-500/10' : 'border-slate-100 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <span className="material-symbols-outlined">block</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
              <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {editingId ? 'Edit Data Personel' : 'Tambah Personel Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-white'}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan Nama Lengkap"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Pangkat</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Brigadir"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.pangkat}
                    onChange={(e) => setFormData({...formData, pangkat: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">NRP / NIP</label>
                  <input 
                    type="text" 
                    placeholder="99999999"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.nrp}
                    onChange={(e) => setFormData({...formData, nrp: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Jabatan</label>
                  <input 
                    type="text" 
                    placeholder="User Testing"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.jabatan}
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Kesatuan</label>
                  <input 
                    type="text" 
                    placeholder="Polres Malang"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.kesatuan}
                    onChange={(e) => setFormData({...formData, kesatuan: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="testing@polri.go.id"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Role</label>
                  <select 
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.USER}>User (Personel)</option>
                    <option value={UserRole.ADMIN_POLRES}>Admin (Polres/Kesatuan)</option>
                    <option value={UserRole.ADMIN_POLDA}>Super Admin (Pusat)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Status</label>
                  <select 
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-bold text-sm transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all text-sm ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-sky-600 text-white rounded-xl font-black text-sm hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Action Modal (Delete/Deactivate) */}
      {actionTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="p-8 text-center space-y-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                actionStep === 'choice' 
                  ? (isDarkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600')
                  : (actionType === 'delete' ? (isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600') : (isDarkMode ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600'))
              }`}>
                <span className="material-symbols-outlined text-4xl">
                  {actionStep === 'choice' ? 'warning' : (actionType === 'delete' ? 'delete_forever' : 'block')}
                </span>
              </div>

              {actionStep === 'choice' ? (
                <>
                  <div className="space-y-2">
                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Tindakan Personel</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Pilih tindakan yang ingin dilakukan untuk <span className="font-bold text-sky-600">{actionTarget.nama}</span>.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => { setActionType('deactivate'); setActionStep('confirm'); }}
                      className={`flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all group ${
                        isDarkMode ? 'border-slate-800 hover:border-blue-500 bg-slate-800/50' : 'border-slate-100 hover:border-blue-500 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-blue-500">block</span>
                        <div className="text-left">
                          <div className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nonaktifkan</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ubah status ke Nonaktif</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
                    </button>
                    <button 
                      onClick={() => { setActionType('delete'); setActionStep('confirm'); }}
                      className={`flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all group ${
                        isDarkMode ? 'border-slate-800 hover:border-rose-500 bg-slate-800/50' : 'border-slate-100 hover:border-rose-500 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-rose-500">delete_forever</span>
                        <div className="text-left">
                          <div className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hapus Permanen</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hapus data dari sistem</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-rose-500 transition-colors">chevron_right</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setActionTarget(null)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Konfirmasi Akhir</h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Apakah Anda benar-benar yakin ingin {actionType === 'delete' ? <span className="text-rose-600 font-black">MENGHAPUS</span> : <span className="text-blue-600 font-black">MENONAKTIFKAN</span>} data <span className="font-bold text-sky-600">{actionTarget.nama}</span>?
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={executeAction}
                      className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 ${
                        actionType === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                      }`}
                    >
                      Ya, Saya Yakin
                    </button>
                    <button 
                      onClick={() => setActionStep('choice')}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      Kembali
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </main>
  );
};

export default PersonnelData;
