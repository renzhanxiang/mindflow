import React, { useState, useRef } from 'react';
import { Entry, EmotionType } from '../types';
import { EMOTION_CONFIG } from '../constants';
import { Clock, Tag, Play, Pause, Edit2, Share2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { generateEntryInsight } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelineViewProps {
  entries: Entry[];
  onUpdateEntry: (id: string, updates: Partial<Entry>) => void;
  onDeleteEntry: (id: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, onUpdateEntry, onDeleteEntry }) => {
  const { t, language } = useLanguage();
  // Sort entries newest first
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingEmotionId, setEditingEmotionId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const toggleAudio = (entry: Entry) => {
    if (!entry.audioBase64) return;

    if (playingId === entry.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
    }
    if (audioRef.current) {
        audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/webm;base64,${entry.audioBase64}`);
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    audio.play().catch(e => console.error("Playback failed", e));
    setPlayingId(entry.id);
  };

  const handleEmotionSelect = (entryId: string, newEmotion: EmotionType) => {
    onUpdateEntry(entryId, { emotion: newEmotion });
    setEditingEmotionId(null);
  };

  const handleShare = async (entry: Entry) => {
    const dateStr = new Date(entry.timestamp).toLocaleString();
    const config = EMOTION_CONFIG[entry.emotion];
    const label = t(`emotion.${entry.emotion}`);
    const shareText = `${entry.text}\n\n[${label}] ${dateStr} #MindFlow`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MindFlow Memory',
          text: shareText,
        });
      } catch (error) {
        if ((error as any).name !== 'AbortError') console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDelete = (entry: Entry) => {
    if (window.confirm(t('timeline.deleteConfirm'))) {
        onDeleteEntry(entry.id);
    }
  };

  const handleGenerateInsight = async (entry: Entry) => {
    if (entry.aiAnalysis) return; 
    setAnalyzingId(entry.id);
    const insight = await generateEntryInsight(entry.text, t(`emotion.${entry.emotion}`), language);
    if (insight) {
      onUpdateEntry(entry.id, { aiAnalysis: insight });
    }
    setAnalyzingId(null);
  };

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg">{t('timeline.empty')}</p>
        <p className="text-sm">{t('timeline.emptySub')}</p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="pb-32 px-4 pt-4 overflow-y-auto h-full no-scrollbar relative">
      {editingEmotionId && (
        <div 
          className="fixed inset-0 z-40 bg-black/5" 
          onClick={() => setEditingEmotionId(null)}
        />
      )}

      {sortedEntries.map((entry) => {
        const currentDate = formatDate(entry.timestamp);
        const showDateHeader = currentDate !== lastDate;
        lastDate = currentDate;
        
        const config = EMOTION_CONFIG[entry.emotion];
        const EmotionIcon = config.icon;
        const isPlaying = playingId === entry.id;
        const isEditing = editingEmotionId === entry.id;
        const isAnalyzing = analyzingId === entry.id;
        const localizedLabel = t(`emotion.${entry.emotion}`);
        
        // Try to translate category, fallback to original string
        const categoryLabel = entry.category ? t(`category.${entry.category}`) : '';
        const displayCategory = (categoryLabel && categoryLabel !== `category.${entry.category}`) ? categoryLabel : entry.category;

        return (
          <React.Fragment key={entry.id}>
            {showDateHeader && (
              <div className="sticky top-0 z-10 flex justify-center my-4">
                <span className="bg-gray-200/80 backdrop-blur text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                  {currentDate}
                </span>
              </div>
            )}
            
            <div className="mb-4 flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${config.bg} transition-colors duration-300`}>
                  <EmotionIcon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="w-0.5 bg-gray-100 h-full mt-2 rounded-full"></div>
              </div>

              <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 relative group">
                {/* Category Badge */}
                {entry.category && (
                    <div className="absolute top-4 right-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border border-gray-100 px-2 py-0.5 rounded-full">
                        {displayCategory}
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 pr-16">
                  <div className="flex items-center gap-2 relative">
                    {/* Emotion Pill */}
                    <div className="relative z-50">
                        <button 
                            onClick={() => setEditingEmotionId(isEditing ? null : entry.id)}
                            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all hover:opacity-80 active:scale-95`} 
                            style={{ backgroundColor: config.color + '20', color: config.color }}
                        >
                          {localizedLabel}
                          <Edit2 size={8} className="opacity-50" />
                        </button>
                        
                        {/* Picker */}
                        {isEditing && (
                            <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-lg p-2 grid grid-cols-4 gap-2 w-48 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                                {Object.values(EmotionType).map((emo) => {
                                    const emoConfig = EMOTION_CONFIG[emo];
                                    const EmoIcon = emoConfig.icon;
                                    return (
                                        <button
                                            key={emo}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEmotionSelect(entry.id, emo);
                                            }}
                                            className={`flex items-center justify-center p-2 rounded-md hover:bg-gray-50 transition-colors ${entry.emotion === emo ? 'bg-brand-50 ring-1 ring-brand-200' : ''}`}
                                            title={t(`emotion.${emo}`)}
                                        >
                                            <EmoIcon size={16} style={{ color: emoConfig.color }} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {formatTime(entry.timestamp)}
                    </span>
                    
                    {entry.audioBase64 && (
                        <button 
                            onClick={() => toggleAudio(entry)}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors ml-1 active:scale-90"
                            title={t('timeline.play')}
                        >
                            {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                        </button>
                    )}
                  </div>
                </div>
                
                <p className="text-slate-700 leading-relaxed text-sm md:text-base select-text">
                  {entry.text}
                </p>

                {/* AI Insight Section */}
                {entry.aiAnalysis && (
                  <div className="mt-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-sm text-indigo-800 italic flex gap-2 animate-in fade-in slide-in-from-top-2">
                     <Sparkles size={16} className="shrink-0 mt-0.5 text-indigo-500" />
                     <span>{entry.aiAnalysis}</span>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-end justify-between min-h-[24px]">
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.length > 0 && entry.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                        <Tag size={10} /> #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    {!entry.aiAnalysis && (
                      <button 
                        onClick={() => handleGenerateInsight(entry)}
                        disabled={isAnalyzing}
                        className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors active:scale-90 mr-1"
                        title={t('timeline.insight')}
                      >
                        {isAnalyzing ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Sparkles size={16} />}
                      </button>
                    )}

                    <button 
                        onClick={() => handleShare(entry)}
                        className="p-1.5 text-gray-300 hover:text-brand-500 hover:bg-brand-50 rounded-full transition-colors active:scale-90"
                        title={t('timeline.share')}
                    >
                        <Share2 size={16} />
                    </button>
                    
                    <button 
                        onClick={() => handleDelete(entry)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-90"
                        title={t('timeline.delete')}
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TimelineView;