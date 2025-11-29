import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Database, Trash2, Key, Check, AlertTriangle, Globe } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';

interface UserMenuProps {
  username: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onManageData: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ username, onLogout, onDeleteAccount, onManageData }) => {
  const { t, language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [cpStatus, setCpStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [cpMessage, setCpMessage] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setCpStatus('error');
        setCpMessage('Password must be at least 6 characters');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setCpStatus('error');
        setCpMessage('Passwords do not match');
        return;
    }
    setCpStatus('loading');
    const result = await StorageService.changePassword(newPassword);
    if (result.success) {
        setCpStatus('success');
        setCpMessage('Password updated successfully');
        setTimeout(() => {
            setShowChangePassword(false);
            setCpStatus('idle');
            setNewPassword('');
            setConfirmNewPassword('');
        }, 1500);
    } else {
        setCpStatus('error');
        setCpMessage(result.message || 'Failed to update password');
    }
  };

  const initial = username.charAt(0).toUpperCase();

  const toggleLanguage = () => {
    setLanguage(language === Language.EN ? Language.ZH : Language.EN);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border border-brand-200 flex items-center justify-center text-brand-700 font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('menu.signedIn')}</p>
            <p className="text-sm font-bold text-slate-800 truncate">{username}</p>
          </div>
          
          <div className="p-1 space-y-0.5">
             <button 
               onClick={() => {
                   onManageData();
                   setIsOpen(false);
               }}
               className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
             >
               <Database size={16} />
               <span>{t('menu.manageData')}</span>
             </button>

             <button 
               onClick={() => {
                   setShowChangePassword(true);
                   setIsOpen(false);
               }}
               className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
             >
               <Key size={16} />
               <span>{t('menu.changePassword')}</span>
             </button>
             
             {/* Language Switcher */}
             <button 
               onClick={toggleLanguage}
               className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-between transition-colors"
             >
               <div className="flex items-center gap-2">
                 <Globe size={16} />
                 <span>{t('menu.language')}</span>
               </div>
               <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                 {language === Language.EN ? 'EN' : '中文'}
               </span>
             </button>

             <div className="h-px bg-gray-100 my-1"></div>

             <button
              onClick={() => {
                  onLogout();
                  setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              <span>{t('menu.logout')}</span>
            </button>

            <button
              onClick={() => {
                  setShowDeleteConfirm(true);
                  setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} />
              <span>{t('menu.deleteAccount')}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Modals (Portaled to body to ensure centering) --- */}

      {/* Change Password Modal */}
      {showChangePassword && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 relative">
                 <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider text-center">
                     {t('menu.changePassword')}
                 </h3>
                 <form onSubmit={handleChangePassword} className="space-y-5">
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('auth.password')}</label>
                         <input 
                            type="password" 
                            className="w-full bg-slate-700 border-none rounded-lg p-3 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                         />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('auth.confirmPassword')}</label>
                         <input 
                            type="password" 
                            className="w-full bg-slate-700 border-none rounded-lg p-3 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            value={confirmNewPassword}
                            onChange={e => setConfirmNewPassword(e.target.value)}
                         />
                     </div>
                     
                     {cpStatus === 'error' && <p className="text-xs text-red-500 text-center">{cpMessage}</p>}
                     {cpStatus === 'success' && <p className="text-xs text-green-500 flex items-center justify-center gap-1"><Check size={12}/> {cpMessage}</p>}

                     <div className="flex gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setShowChangePassword(false)}
                            className="flex-1 py-3 text-slate-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            {t('modal.cancel')}
                        </button>
                        <button 
                            type="submit"
                            disabled={cpStatus === 'loading'}
                            className="flex-1 py-3 text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-200 transition-colors"
                        >
                            {t('modal.update')}
                        </button>
                     </div>
                 </form>
             </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="bg-red-100 p-2 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{t('modal.deleteConfirm')}</h3>
                </div>
                
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {t('modal.deleteDesc')}
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2.5 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        {t('modal.cancel')}
                    </button>
                    <button 
                        onClick={() => {
                            onDeleteAccount();
                            setShowDeleteConfirm(false);
                        }}
                        className="flex-1 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-colors"
                    >
                        {t('modal.yesDeactivate')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserMenu;