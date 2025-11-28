import React, { useState } from 'react';
import { Entry, EmotionType } from '../types';
import { EMOTION_CONFIG } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  entries: Entry[];
  onSelectDate: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Group entries by day
  const entriesByDay: Record<number, Entry[]> = {};
  entries.forEach(entry => {
    const d = new Date(entry.timestamp);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!entriesByDay[day]) entriesByDay[day] = [];
      entriesByDay[day].push(entry);
    }
  });

  // Determine dominant emotion for a day
  const getDominantEmotion = (dayEntries: Entry[]): EmotionType | null => {
    if (!dayEntries || dayEntries.length === 0) return null;
    // Simple mode: most frequent
    const counts: Record<string, number> = {};
    dayEntries.forEach(e => counts[e.emotion] = (counts[e.emotion] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0] as EmotionType;
  };

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/50"></div>);
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEntries = entriesByDay[d];
    const dominantEmotion = getDominantEmotion(dayEntries);
    const config = dominantEmotion ? EMOTION_CONFIG[dominantEmotion] : null;

    days.push(
      <div 
        key={d} 
        onClick={() => onSelectDate(new Date(year, month, d))}
        className={`
          h-24 md:h-32 border border-gray-50 relative p-1 transition-colors hover:bg-gray-50 cursor-pointer
          flex flex-col items-center justify-start pt-2
        `}
      >
        <span className={`text-sm font-medium ${dominantEmotion ? 'text-gray-600' : 'text-gray-400'}`}>{d}</span>
        
        {dominantEmotion && config ? (
          <div className="mt-2 flex flex-col items-center animate-fade-in">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                <config.icon className="w-5 h-5" style={{ color: config.color }} />
             </div>
             <div className="mt-1 flex gap-0.5">
               {dayEntries.length > 1 && (
                  <span className="text-[10px] text-gray-400 font-medium">+{dayEntries.length - 1}</span>
               )}
             </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 h-full flex flex-col no-scrollbar overflow-y-auto">
       <div className="flex items-center justify-between px-6 mb-4">
         <h2 className="text-xl font-bold text-slate-800">
           {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
         </h2>
         <div className="flex gap-2">
           <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20}/></button>
           <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20}/></button>
         </div>
       </div>

       <div className="grid grid-cols-7 text-center border-b border-gray-100 pb-2 mb-2">
         {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
           <div key={d} className="text-xs font-semibold text-gray-400">{d}</div>
         ))}
       </div>

       <div className="grid grid-cols-7 flex-1 auto-rows-fr">
         {days}
       </div>
    </div>
  );
};

export default CalendarView;