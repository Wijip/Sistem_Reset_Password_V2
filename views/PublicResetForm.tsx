
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SiteSettings, RequestPriority } from '../types';

interface PublicResetFormProps {
  onSubmit: (nrp: string, alasan: string, dokumen_kta?: string, prioritas?: RequestPriority) => { success: boolean, message: string };
  siteSettings: SiteSettings;
}

const PublicResetForm: React.FC<PublicResetFormProps> = ({ onSubmit, siteSettings }) => {
  const [nrp, setNrp] = useState('');
  const [alasan, setAlasan] = useState('');
  const [prioritas, setPrioritas] = useState<RequestPriority>(RequestPriority.NORMAL);
  const [dokumen, setDokumen] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean, message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDokumen(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const res = onSubmit(nrp, alasan, dokumen || undefined, prioritas);
      setResult(res);
      setIsSubmitting(false);
      if (res.success) {
        setNrp('');
        setAlasan('');
        setDokumen(null);
        setPrioritas(RequestPriority.NORMAL);
      }
    }, 1500);
  };

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto transition-colors duration-300 ${siteSettings.darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-scale-in transition-colors duration-300 ${siteSettings.darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-8 md:p-12 text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
             {siteSettings.logo ? (
              <div className="w-24 h-24 flex items-center justify-center">
                <img src={siteSettings.logo} alt="Logo" className="w-24 h-24 object-contain drop-shadow-xl" />
              </div>
            ) : (
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-blue-600 shadow-xl ${siteSettings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border border-slate-200'}`}>
                <span className="material-symbols-outlined text-6xl">local_police</span>
              </div>
            )}
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${siteSettings.darkMode ? 'text-white' : 'text-slate-800'}`}>Pengajuan Reset Password</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">Layanan Mandiri Personel {siteSettings.name}</p>
            </div>
          </div>

          {!result?.success ? (
            <form onSubmit={handleSubmit} className="text-left space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Registrasi Pokok (NRP)</label>
                <input 
                  type="text" 
                  className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-sky-500/10 font-black text-sm transition-all ${
                    siteSettings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="Masukkan 8 digit NRP"
                  value={nrp}
                  onChange={(e) => setNrp(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Prioritas</label>
                  <select 
                    value={prioritas}
                    onChange={(e) => setPrioritas(e.target.value as RequestPriority)}
                    className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all ${
                      siteSettings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value={RequestPriority.NORMAL}>Normal</option>
                    <option value={RequestPriority.PENTING}>Penting</option>
                    <option value={RequestPriority.MENDESAK}>Mendesak</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen KTA</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full px-5 py-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all ${
                      dokumen ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-300'
                    } ${siteSettings.darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`material-symbols-outlined ${dokumen ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {dokumen ? 'check_circle' : 'upload_file'}
                    </span>
                    <span className={`text-xs font-bold truncate max-w-[100px] ${dokumen ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {dokumen ? 'Terunggah' : 'Upload KTA'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Alasan Reset</label>
                <textarea 
                  className={`w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all resize-none h-24 ${
                    siteSettings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="Contoh: Lupa password akun email polri"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  required
                ></textarea>
              </div>

              {result && !result.success && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">error</span>
                  {result.message}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-base shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                }`}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </form>
          ) : (
            <div className="py-8 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <span className="material-symbols-outlined text-[56px]">check_circle</span>
              </div>
              <div className="space-y-2">
                <h3 className={`text-xl font-black ${siteSettings.darkMode ? 'text-white' : 'text-slate-800'}`}>Pengajuan Berhasil!</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Permintaan Anda telah masuk ke sistem dengan prioritas <span className="text-blue-600 font-bold">{prioritas}</span>. Silakan hubungi Admin atau tunggu notifikasi lebih lanjut.
                </p>
              </div>
              <button 
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all"
              >
                Kembali
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
            <Link to="/login" className="text-xs font-black text-sky-600 hover:underline uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.5s ease forwards; }
      `}</style>
    </div>
  );
};

export default PublicResetForm;
