import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Lock, User, ArrowRight, Sparkles, Settings, Cloud, Database, Mail, CheckCircle, Code } from 'lucide-react';
import { CloudConfig } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthViewProps {
  onLoginSuccess: (username: string) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  // Server Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'db'>('config');
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ url: '', key: '', enabled: false });

  useEffect(() => {
    setCloudConfig(StorageService.getCloudConfig());
  }, []);

  const handleSaveSettings = () => {
    StorageService.saveCloudConfig(cloudConfig);
    setShowSettings(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const result = await StorageService.login(username, password);
        if (result.success) {
          onLoginSuccess(username);
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        const result = await StorageService.register(username, password);
        if (result.success) {
          if (result.confirmationRequired) {
             setConfirmationPending(true);
          } else {
             // Auto login after register if no confirmation needed
             await StorageService.login(username, password);
             onLoginSuccess(username);
          }
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 z-50 fixed inset-0">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 flex flex-col max-h-[90vh]">
          <div className="flex items-center gap-2 mb-4 text-brand-600">
            <Database size={24} />
            <h2 className="text-xl font-bold text-slate-800">{t('auth.settings')}</h2>
          </div>
          
          <div className="flex gap-2 mb-4 border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'}`}
              >
                  Connection
              </button>
              <button 
                onClick={() => setActiveTab('db')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'db' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'}`}
              >
                  Database Setup
              </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-2">
            {activeTab === 'config' ? (
                <>
                <p className="text-sm text-gray-500 mb-6">
                    Connect a Supabase database to sync your thoughts across devices. 
                    If disabled, data will be stored locally on this device only.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-700">Enable Cloud Sync</span>
                    <button 
                        onClick={() => setCloudConfig(c => ({...c, enabled: !c.enabled}))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${cloudConfig.enabled ? 'bg-brand-500' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${cloudConfig.enabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                    </div>

                    {cloudConfig.enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Project URL</label>
                        <input 
                            type="text" 
                            value={cloudConfig.url}
                            onChange={e => setCloudConfig(c => ({...c, url: e.target.value}))}
                            placeholder="https://xyz.supabase.co"
                            className="w-full border rounded-lg p-2 text-sm mt-1"
                        />
                        </div>
                        <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Anon API Key</label>
                        <input 
                            type="password" 
                            value={cloudConfig.key}
                            onChange={e => setCloudConfig(c => ({...c, key: e.target.value}))}
                            placeholder="eyJhbGci..."
                            className="w-full border rounded-lg p-2 text-sm mt-1"
                        />
                        </div>
                    </div>
                    )}
                </div>
                </>
            ) : (
                <div className="space-y-4 animate-in fade-in">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-xs">
                        Run this SQL in your Supabase SQL Editor to create the necessary table.
                    </div>
                    <div className="relative bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                        <Code size={16} className="absolute top-2 right-2 text-slate-600"/>
                        <pre>{`-- 1. Create User Data Table
CREATE TABLE IF NOT EXISTS user_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS user_data_user_id_idx ON user_data (user_id);

-- 3. Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. Create Access Policy
CREATE POLICY "Users can only access their own data" ON user_data
  FOR ALL USING (auth.uid() = user_id);`}</pre>
                    </div>
                </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => setShowSettings(false)}
              className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl"
            >
              {t('modal.cancel')}
            </button>
            <button 
              onClick={handleSaveSettings}
              className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Pending Screen
  if (confirmationPending) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('auth.checkEmail')}</h2>
                <p className="text-gray-500 mb-6">
                    {t('auth.emailSent')} <span className="font-semibold text-slate-700">{username}</span>.
                </p>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 text-left">
                    <p className="text-xs text-yellow-800 font-medium flex gap-2">
                       <span className="shrink-0">💡</span>
                       <span>
                         Clicking the link in your email will redirect you back here. 
                         If you see "localhost refused connection", please make sure you register from your deployed URL.
                       </span>
                    </p>
                </div>
                <button 
                    onClick={() => { setConfirmationPending(false); setIsLogin(true); }}
                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-colors"
                >
                    {t('auth.backLogin')}
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Settings Toggle */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 p-2 bg-white/50 backdrop-blur rounded-full text-gray-500 hover:text-brand-600 hover:bg-white transition-all shadow-sm z-20"
      >
        <Settings size={20} />
      </button>

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl border border-white p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">MindFlow</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <p className="text-gray-500 font-medium text-sm">{t('app.subtitle')}</p>
             {cloudConfig.enabled ? (
               <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold">
                 <Cloud size={10} /> Cloud
               </span>
             ) : (
               <span className="flex items-center gap-0.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-bold">
                 <Database size={10} /> Local
               </span>
             )}
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-8 relative">
          <div 
            className={`absolute left-1 top-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out ${isLogin ? 'translate-x-0' : 'translate-x-full'}`}
          ></div>
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold text-center z-10 relative transition-colors ${isLogin ? 'text-slate-800' : 'text-gray-400'}`}
          >
            {t('auth.login')}
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold text-center z-10 relative transition-colors ${!isLogin ? 'text-slate-800' : 'text-gray-400'}`}
          >
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
              {cloudConfig.enabled ? t('auth.email') : t('auth.username')}
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder={cloudConfig.enabled ? "name@example.com" : "Enter username"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">{t('auth.password')}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="Enter password"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">{t('auth.confirmPassword')}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  placeholder="Repeat password"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 text-sm py-2 px-4 rounded-lg flex items-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-300/50 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? t('auth.start') : t('auth.createAccount'))}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm text-center">
        {cloudConfig.enabled 
          ? t('auth.mode.cloud')
          : t('auth.mode.local')}
      </p>
    </div>
  );
};

export default AuthView;