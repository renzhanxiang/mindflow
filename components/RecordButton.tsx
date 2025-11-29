import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Keyboard, X, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface RecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
}

const RecordButton: React.FC<RecordButtonProps> = ({ onRecordingComplete, onTextSubmit, isProcessing }) => {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeInputType, setActiveInputType] = useState<'voice' | 'text'>('voice');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        setActiveInputType('voice');
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    setActiveInputType('text');
    onTextSubmit(textInput);
    setTextInput('');
    setShowTextInput(false);
  };

  const isVoiceProcessing = isProcessing && activeInputType === 'voice';
  const isTextProcessing = isProcessing && activeInputType === 'text';

  return (
    <>
      <div className="absolute left-1/2 transform -translate-x-1/2 z-50 bottom-[calc(7rem+env(safe-area-inset-bottom))] flex items-end gap-4">
        
        {!isRecording && (
            <button
                onClick={() => setShowTextInput(true)}
                disabled={isProcessing}
                className={`
                flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ring-4 ring-white
                ${isTextProcessing ? 'bg-brand-100' : 'bg-white hover:bg-gray-50 text-brand-600'}
                ${isProcessing && !isTextProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isTextProcessing ? (
                    <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                ) : (
                    <Keyboard className="w-6 h-6" />
                )}
            </button>
        )}

        <button
          onClick={handleToggleRecording}
          disabled={isProcessing}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ring-4 ring-white
            ${isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-brand-600 hover:bg-brand-500 hover:scale-105 active:scale-95'}
            ${isProcessing ? 'cursor-not-allowed' : ''}
            ${isProcessing && !isVoiceProcessing ? 'bg-gray-400' : ''} 
          `}
        >
          {isVoiceProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5 text-white fill-current" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </button>

        {isRecording && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap backdrop-blur">
            {t('record.listening')}
          </div>
        )}
      </div>

      {showTextInput && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 mb-[env(safe-area-inset-bottom)] sm:mb-0">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-slate-800">{t('modal.newThought')}</h3>
                     <button onClick={() => setShowTextInput(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
                         <X size={20} />
                     </button>
                 </div>
                 
                 <textarea
                     value={textInput}
                     onChange={(e) => setTextInput(e.target.value)}
                     placeholder={t('modal.mindPlaceholder')}
                     className="w-full h-32 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none text-slate-700 text-base mb-4 outline-none"
                     autoFocus
                 />

                 <div className="flex gap-3">
                     <button 
                         onClick={() => setShowTextInput(false)}
                         className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                     >
                         {t('modal.cancel')}
                     </button>
                     <button 
                         onClick={handleTextSubmit}
                         disabled={!textInput.trim()}
                         className="flex-1 py-3 text-white font-bold bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-200 transition-colors disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                     >
                         <Send size={18} /> {t('modal.addNote')}
                     </button>
                 </div>
             </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default RecordButton;