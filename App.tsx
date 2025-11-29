import React, { useState, useEffect } from 'react';
import { ViewMode, Entry, Language } from './types';
import { analyzeAudioEntry, analyzeTextEntry } from './services/geminiService';
import { StorageService } from './services/storage';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import ManageDataView from './components/ManageDataView';
import RecordButton from './components/RecordButton';
import AuthView from './components/AuthView';
import UserMenu from './components/UserMenu';
import { CalendarDays, BarChart2, Zap, Search, X, Flame } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.TIMELINE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = StorageService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setLoadingData(true);
        try {
          const userEntries = await StorageService.getUserData(user);
          setEntries(userEntries);
        } catch (e) {
          console.error("Failed to load user data", e);
        } finally {
          setLoadingData(false);
        }
      }
    };
    checkUser();
  }, []);

  const handleLoginSuccess = async (username: string) => {
    setCurrentUser(username);
    setLoadingData(true);
    try {
      const cloudEntries = await StorageService.getUserData(username);
      const localEntries = StorageService.getLocalUserData(username);
      
      let finalEntries = cloudEntries;
      if (cloudEntries.length === 0 && localEntries.length > 0) {
          finalEntries = localEntries;
          const saveResult = await StorageService.saveUserData(username, finalEntries);
          if (!saveResult.success) {
             setShowToast({ message: "Could not sync initial data to cloud.", type: 'error' });
          }
      }
      setEntries(finalEntries);
    } catch (e) {
      console.error(e);
      setShowToast({ message: "Error loading data", type: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setCurrentUser(null);
    setEntries([]);
    setView(ViewMode.TIMELINE);
  };

  const handleDeleteAccount = async () => {
    if (currentUser) {
        setLoadingData(true);
        const result = await StorageService.deactivateAccount(currentUser);
        setLoadingData(false);
        
        if (result.success) {
            setCurrentUser(null);
            setEntries([]);
            setView(ViewMode.TIMELINE);
            setShowToast({ message: "Account deactivated", type: 'success' });
        } else {
            setShowToast({ message: result.message || "Failed to deactivate account", type: 'error' });
        }
    }
  };

  const handleDeleteEntries = async (idsToDelete: string[]) => {
      const remainingEntries = entries.filter(e => !idsToDelete.includes(e.id));
      await saveToStorage(remainingEntries);
      setShowToast({ message: `Deleted ${idsToDelete.length} items`, type: 'success' });
  };

  const saveToStorage = async (updatedEntries: Entry[]) => {
    if (currentUser) {
      setEntries(updatedEntries);
      const result = await StorageService.saveUserData(currentUser, updatedEntries);
      if (result && !result.success) {
         console.warn("Save failed", result.error);
         setShowToast({ message: "Failed to save changes", type: 'error' });
      }
    }
  };

  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const uniqueDays = new Set<string>();
    sorted.forEach(e => uniqueDays.add(new Date(e.timestamp).toDateString()));
    const sortedDays = Array.from(uniqueDays).map(d => new Date(d));
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let streak = 0;
    const latestEntryDate = sortedDays[0];
    const diffTime = Math.abs(today.getTime() - latestEntryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return 0;

    for (let i = 0; i < sortedDays.length; i++) {
        const current = sortedDays[i];
        if (i === 0) {
            streak = 1;
            continue;
        }
        const prev = sortedDays[i-1];
        const dayDiff = (prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) streak++; else break;
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!currentUser) return;
    setIsProcessing(true);
    setShowToast({ message: t('record.analyzing'), type: "success" }); 
    try {
      const base64 = await blobToBase64(audioBlob);
      // Pass language for AI to know context
      const result = await analyzeAudioEntry(base64, language);
      
      const newEntry: Entry = {
        id: generateId(),
        text: result.text,
        timestamp: Date.now(),
        emotion: result.emotion,
        tags: result.tags,
        category: result.category,
        audioBase64: base64
      };
      const updatedEntries = [newEntry, ...entries];
      await saveToStorage(updatedEntries);
      setShowToast({ message: t('record.saved'), type: "success" });
    } catch (error) {
      console.error(error);
      setShowToast({ message: t('record.failed'), type: "error" });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleTextSubmit = async (text: string) => {
    if (!currentUser) return;
    setIsProcessing(true);
    setShowToast({ message: t('record.analyzing'), type: "success" });
    try {
        // Pass language
        const result = await analyzeTextEntry(text, language);
        const newEntry: Entry = {
            id: generateId(),
            text: text,
            timestamp: Date.now(),
            emotion: result.emotion,
            tags: result.tags,
            category: result.category,
        };
        const updatedEntries = [newEntry, ...entries];
        await saveToStorage(updatedEntries);
        setShowToast({ message: t('record.saved'), type: "success" });
    } catch (error) {
        console.error(error);
        setShowToast({ message: t('record.failed'), type: "error" });
    } finally {
        setIsProcessing(false);
        setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleUpdateEntry = async (id: string, updates: Partial<Entry>) => {
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    );
    await saveToStorage(updatedEntries);
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.text.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (entry.category && entry.category.toLowerCase().includes(query))
    );
  });

  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === ViewMode.MANAGE_DATA) {
      return (
          <ManageDataView 
              entries={entries} 
              onBack={() => setView(ViewMode.TIMELINE)} 
              onDelete={handleDeleteEntries}
          />
      );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative font-sans">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md pt-[calc(3rem+env(safe-area-inset-top))] pb-4 px-6 sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center transition-all duration-300">
         {!isSearchOpen ? (
           <>
             <div className="flex-1">
               <h1 className="text-2xl font-black bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                 MindFlow
               </h1>
               <p className="text-xs text-gray-400 font-medium">{t('app.subtitle')}</p>
             </div>
             <div className="flex items-center gap-3">
               
               {/* Streak Counter */}
               {currentStreak > 0 && (
                   <div className="flex items-center gap-1 bg-orange-50 text-orange-500 px-2 py-1 rounded-full border border-orange-100 animate-in fade-in zoom-in">
                       <Flame size={14} className="fill-current" />
                       <span className="text-xs font-bold">{currentStreak}</span>
                   </div>
               )}

               <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
               >
                 <Search size={18} />
               </button>
               
               <UserMenu 
                  username={currentUser} 
                  onLogout={handleLogout} 
                  onDeleteAccount={handleDeleteAccount}
                  onManageData={() => setView(ViewMode.MANAGE_DATA)}
               />
             </div>
           </>
         ) : (
           <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-right-10 duration-200">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={t('search.placeholder')} 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 text-slate-700 select-text"
                 autoFocus
               />
             </div>
             <button 
               onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
               className="p-2 text-slate-400 hover:text-slate-600 active:scale-95"
             >
               <X size={20} />
             </button>
           </div>
         )}
      </div>

      <main className="flex-1 overflow-hidden relative">
        {loadingData ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <>
            {view === ViewMode.TIMELINE && (
                <TimelineView 
                  entries={filteredEntries} 
                  onUpdateEntry={handleUpdateEntry} 
                  onDeleteEntry={(id) => handleDeleteEntries([id])}
                />
            )}
            {view === ViewMode.CALENDAR && (
                <CalendarView entries={entries} onSelectDate={(date) => { setView(ViewMode.TIMELINE); }} />
            )}
            {view === ViewMode.STATS && (
                <StatsView entries={entries} />
            )}
          </>
        )}
      </main>

      {showToast && (
        <div className={`fixed top-[calc(6rem+env(safe-area-inset-top))] left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-xl text-sm font-medium animate-bounce z-50 text-white ${showToast.type === 'error' ? 'bg-red-500' : 'bg-brand-600'}`}>
          {showToast.message}
        </div>
      )}

      <RecordButton 
          onRecordingComplete={handleRecordingComplete} 
          onTextSubmit={handleTextSubmit} 
          isProcessing={isProcessing} 
      />

      <nav className="bg-white border-t border-slate-200 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] absolute bottom-0 w-full flex items-center justify-around z-10 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setView(ViewMode.TIMELINE)}
          className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.TIMELINE ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Zap size={24} fill={view === ViewMode.TIMELINE ? "currentColor" : "none"} />
          <span className="text-[10px] font-medium">{t('nav.flow')}</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.CALENDAR)}
           className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.CALENDAR ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CalendarDays size={24} />
          <span className="text-[10px] font-medium">{t('nav.calendar')}</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.STATS)}
           className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.STATS ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-medium">{t('nav.insights')}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;