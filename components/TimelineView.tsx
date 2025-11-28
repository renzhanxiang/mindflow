import React, { useState, useRef } from 'react';
import { Entry, EmotionType } from '../types';
import { EMOTION_CONFIG } from '../constants';
import { Clock, Tag, Play, Pause, Edit2, Check } from 'lucide-react';

interface TimelineViewProps {
  entries: Entry[];
  onUpdateEntry: (id: string, updates: Partial<Entry>) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, onUpdateEntry }) => {
  // Sort entries newest first
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingEmotionId, setEditingEmotionId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const toggleAudio = (entry: Entry) => {
    if (!entry.audioBase64) return;

    if (playingId === entry.id) {
        // Pause if currently playing this entry
        audioRef.current?.pause();
        setPlayingId(null);
        return;
    }

    // Stop currently playing if any
    if (audioRef.current) {
        audioRef.current.pause();
    }

    // Play new entry
    // Construct data URI assuming webm format from recorder
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

  if (sortedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg">No entries found.</p>
        <p className="text-sm">Try recording a new thought.</p>
      </div>
    );
  }

  let lastDate = '';

  // Increased bottom padding to pb-32 for safe areas
  return (
    <div className="pb-32 px-4 pt-4 overflow-y-auto h-full no-scrollbar relative">
      {/* Overlay to close emotion picker if open */}
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
                        {entry.category}
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 pr-16"> {/* pr-16 for category badge space */}
                  <div className="flex items-center gap-2 relative">
                    {/* Emotion Pill (Clickable) */}
                    <div className="relative z-50">
                        <button 
                            onClick={() => setEditingEmotionId(isEditing ? null : entry.id)}
                            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all hover:opacity-80 active:scale-95`} 
                            style={{ backgroundColor: config.color + '20', color: config.color }}
                        >
                          {config.label}
                          <Edit2 size={8} className="opacity-50" />
                        </button>
                        
                        {/* Emotion Picker Popover */}
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
                                            title={emoConfig.label}
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
                    
                    {/* Audio Player Button */}
                    {entry.audioBase64 && (
                        <button 
                            onClick={() => toggleAudio(entry)}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors ml-1 active:scale-90"
                            title="Play recording"
                        >
                            {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                        </button>
                    )}
                  </div>
                </div>
                
                <p className="text-slate-700 leading-relaxed text-sm md:text-base select-text">
                  {entry.text}
                </p>

                {entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1 border border-gray-100">
                        <Tag size={10} /> #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TimelineView;