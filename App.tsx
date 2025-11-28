import React, { useState, useEffect } from 'react';
import { ViewMode, Entry } from './types';
import { analyzeAudioEntry } from './services/geminiService';
import { StorageService } from './services/storage';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import RecordButton from './components/RecordButton';
import AuthView from './components/AuthView';
import UserMenu from './components/UserMenu';
import { CalendarDays, BarChart2, Zap, Search, X } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.TIMELINE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // --- Auth & Data Loading ---

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
      // 1. Get Cloud Data
      const cloudEntries = await StorageService.getUserData(username);
      
      // 2. Get any temp local data (if user was using app offline/locally before)
      // Note: In this simple flow, we usually just assume cloud is source of truth.
      // But if we want to be safe:
      const localEntries = StorageService.getLocalUserData(username);
      
      // 3. Merge: Prefer Cloud, but if Cloud is empty and Local has data (and we just switched), maybe upload local?
      // For now, let's just use cloudEntries if they exist, otherwise local.
      let finalEntries = cloudEntries;
      
      // Simple merge strategy: if cloud is empty but we have local entries, upload them now.
      if (cloudEntries.length === 0 && localEntries.length > 0) {
          finalEntries = localEntries;
          // Sync back to cloud immediately
          const saveResult = await StorageService.saveUserData(username, finalEntries);
          if (!saveResult.success) {
             setShowToast({ message: "Could not sync initial data to cloud. Check table setup.", type: 'error' });
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

  const saveToStorage = async (updatedEntries: Entry[]) => {
    if (currentUser) {
      // Optimistic update
      setEntries(updatedEntries);
      const result = await StorageService.saveUserData(currentUser, updatedEntries);
      if (result && !result.success) {
         // Optionally show error icon state
         console.warn("Save failed", result.error);
      }
    }
  };

  // --- Core Logic ---

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
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
    setShowToast({ message: "Analyzing your thoughts...", type: "success" }); 
    
    try {
      const base64 = await blobToBase64(audioBlob);
      const result = await analyzeAudioEntry(base64);
      
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
      
      setShowToast({ message: "Thought captured!", type: "success" });
    } catch (error) {
      console.error(error);
      setShowToast({ message: "Analysis failed (Check connection)", type: "error" });
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

  // Filter entries based on search query
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.text.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (entry.category && entry.category.toLowerCase().includes(query))
    );
  });

  // If not logged in, show Auth Screen
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative font-sans">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md pt-[calc(3rem+env(safe-area-inset-top))] pb-4 px-6 sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center transition-all duration-300">
         {!isSearchOpen ? (
           <>
             <div>
               <h1 className="text-2xl font-black bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                 MindFlow
               </h1>
               <p className="text-xs text-gray-400 font-medium">Archive of You</p>
             </div>
             <div className="flex items-center gap-3">
               <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
               >
                 <Search size={18} />
               </button>
               
               <UserMenu username={currentUser} onLogout={handleLogout} />
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
                 placeholder="Search memories..." 
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {loadingData ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <>
            {view === ViewMode.TIMELINE && (
                <TimelineView entries={filteredEntries} onUpdateEntry={handleUpdateEntry} />
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

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-[calc(6rem+env(safe-area-inset-top))] left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-xl text-sm font-medium animate-bounce z-50 text-white ${showToast.type === 'error' ? 'bg-red-500' : 'bg-brand-600'}`}>
          {showToast.message}
        </div>
      )}

      {/* Floating Action Button */}
      <RecordButton onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] absolute bottom-0 w-full flex items-center justify-around z-10 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setView(ViewMode.TIMELINE)}
          className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.TIMELINE ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Zap size={24} fill={view === ViewMode.TIMELINE ? "currentColor" : "none"} />
          <span className="text-[10px] font-medium">Flow</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.CALENDAR)}
           className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.CALENDAR ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CalendarDays size={24} />
          <span className="text-[10px] font-medium">Calendar</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.STATS)}
           className={`flex flex-col items-center gap-1 p-2 w-20 active:scale-95 transition-transform ${view === ViewMode.STATS ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-medium">Insights</span>
        </button>
      </nav>
    </div>
  );
};

export default App;