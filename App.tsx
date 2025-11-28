import React, { useState, useEffect } from 'react';
import { ViewMode, Entry } from './types';
import { MOCK_ENTRIES_SEED } from './constants';
import { analyzeAudioEntry } from './services/geminiService';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import RecordButton from './components/RecordButton';
import { CalendarDays, BarChart2, Zap, Search, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Actually we don't have uuid lib, let's use a helper

// Simple uuid helper
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES_SEED);
  const [view, setView] = useState<ViewMode>(ViewMode.TIMELINE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove Data URL prefix "data:audio/webm;base64,"
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
        audioBase64: base64 // In a real app, upload to storage and save URL
      };

      setEntries(prev => [newEntry, ...prev]);
      setShowToast({ message: "Thought captured!", type: "success" });
    } catch (error) {
      console.error(error);
      setShowToast({ message: "Failed to process audio", type: "error" });
    } finally {
      setIsProcessing(false);
      // Auto-hide toast
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleDateSelect = (date: Date) => {
    // In a real app, this would filter the timeline to that date
    setView(ViewMode.TIMELINE);
  };

  const handleUpdateEntry = (id: string, updates: Partial<Entry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
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

  return (
    <div className="h-full flex flex-col bg-slate-50 relative font-sans">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center transition-all duration-300">
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
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
               >
                 <Search size={18} />
               </button>
               <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                 M
               </div>
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
                 placeholder="Search memories, tags, feelings..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 text-slate-700"
                 autoFocus
               />
             </div>
             <button 
               onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
               className="p-2 text-slate-400 hover:text-slate-600"
             >
               <X size={20} />
             </button>
           </div>
         )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {view === ViewMode.TIMELINE && (
            <TimelineView entries={filteredEntries} onUpdateEntry={handleUpdateEntry} />
        )}
        {view === ViewMode.CALENDAR && (
            <CalendarView entries={entries} onSelectDate={handleDateSelect} />
        )}
        {view === ViewMode.STATS && (
            <StatsView entries={entries} />
        )}
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-xl text-sm font-medium animate-bounce z-50 text-white ${showToast.type === 'error' ? 'bg-red-500' : 'bg-brand-600'}`}>
          {showToast.message}
        </div>
      )}

      {/* Floating Action Button - Moved up above nav via component CSS */}
      <RecordButton onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 h-20 absolute bottom-0 w-full flex items-center justify-around z-10 pb-2 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setView(ViewMode.TIMELINE)}
          className={`flex flex-col items-center gap-1 p-2 w-20 ${view === ViewMode.TIMELINE ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Zap size={24} fill={view === ViewMode.TIMELINE ? "currentColor" : "none"} />
          <span className="text-[10px] font-medium">Flow</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.CALENDAR)}
           className={`flex flex-col items-center gap-1 p-2 w-20 ${view === ViewMode.CALENDAR ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CalendarDays size={24} />
          <span className="text-[10px] font-medium">Calendar</span>
        </button>

        <button 
           onClick={() => setView(ViewMode.STATS)}
           className={`flex flex-col items-center gap-1 p-2 w-20 ${view === ViewMode.STATS ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-medium">Insights</span>
        </button>
      </nav>
    </div>
  );
};

export default App;