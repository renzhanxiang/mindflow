
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Database } from 'lucide-react';

interface UserMenuProps {
  username: string;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ username, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border border-brand-200 flex items-center justify-center text-brand-700 font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Signed in as</p>
            <p className="text-sm font-bold text-slate-800 truncate">{username}</p>
          </div>
          
          <div className="p-1">
             {/* Future: Add Export Data here */}
             <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors">
               <Database size={16} />
               <span>Local Data</span>
             </button>
             
             <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors mt-1"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
