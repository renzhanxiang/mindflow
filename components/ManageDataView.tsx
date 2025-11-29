import React, { useState } from 'react';
import { Entry } from '../types';
import { ArrowLeft, Trash2, CheckCircle, Circle, CheckSquare, Square } from 'lucide-react';
import { EMOTION_CONFIG } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface ManageDataViewProps {
  entries: Entry[];
  onBack: () => void;
  onDelete: (ids: string[]) => void;
}

const ManageDataView: React.FC<ManageDataViewProps> = ({ entries, onBack, onDelete }) => {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedEntries.length && sortedEntries.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedEntries.map(e => e.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t('manage.deleteConfirm', { count: selectedIds.size }))) {
       onDelete(Array.from(selectedIds));
       setSelectedIds(new Set());
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined) + ' ' + new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative z-30">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm z-10 pt-[calc(1rem+env(safe-area-inset-top))] sticky top-0">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{t('manage.title')}</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {sortedEntries.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400">
             <p>{t('manage.empty')}</p>
           </div>
        ) : (
           sortedEntries.map(entry => {
             const isSelected = selectedIds.has(entry.id);
             const EmoIcon = EMOTION_CONFIG[entry.emotion].icon;
             const emoConfig = EMOTION_CONFIG[entry.emotion];
             const localizedLabel = t(`emotion.${entry.emotion}`);
             
             return (
               <div 
                 key={entry.id} 
                 onClick={() => toggleSelection(entry.id)}
                 className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50/20 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
               >
                 <div className={`shrink-0 transition-all duration-200 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                    {isSelected ? (
                        <CheckCircle size={24} className="text-white fill-brand-500" />
                    ) : (
                        <Circle size={24} className="text-gray-300" />
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400 font-medium">{formatDate(entry.timestamp)}</span>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${emoConfig.bg} text-slate-600`}>
                           <EmoIcon size={10} style={{ color: emoConfig.color }} />
                           {localizedLabel}
                        </div>
                    </div>
                    <p className="text-slate-700 text-sm truncate">{entry.text}</p>
                 </div>
               </div>
             )
           })
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
         <button 
           onClick={toggleSelectAll}
           className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors active:scale-95"
         >
           {selectedIds.size === sortedEntries.length && sortedEntries.length > 0 ? (
             <>
               <Square size={20} /> {t('manage.deselectAll')}
             </>
           ) : (
             <>
               <CheckSquare size={20} /> {t('manage.selectAll')}
             </>
           )}
         </button>
         
         <button 
           onClick={handleDelete}
           disabled={selectedIds.size === 0}
           className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-200 active:scale-95"
         >
           <Trash2 size={20} /> {t('manage.deleteSelected')} {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
         </button>
      </div>
    </div>
  );
};

export default ManageDataView;