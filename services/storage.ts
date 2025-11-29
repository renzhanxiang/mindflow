import { Entry, CloudConfig } from '../types';
import { MOCK_ENTRIES_SEED } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const USERS_KEY = 'mindflow_users';
const CURRENT_USER_KEY = 'mindflow_current_user';
const DATA_PREFIX = 'mindflow_data_';
const CLOUD_CONFIG_KEY = 'mindflow_cloud_config';

// Default configuration provided by user
const DEFAULT_URL = 'https://gevzlipqhnunvrcofrip.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdldnpsaXBxaG51bnZyY29mcmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTUxMTcsImV4cCI6MjA3OTg5MTExN30.m-CN3ZSFr_6ot32R9NliDwEYQ3ikFuVhMHgJb2uaFbU';

interface User {
  username: string;
  passwordHash: string;
}

let supabase: SupabaseClient | null = null;

export const StorageService = {
  // --- Helpers ---
  
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // --- Configuration ---

  getCloudConfig: (): CloudConfig => {
    const str = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (str) {
      return JSON.parse(str);
    }
    return { 
      url: DEFAULT_URL, 
      key: DEFAULT_KEY, 
      enabled: true 
    };
  },

  saveCloudConfig: (config: CloudConfig) => {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
    if (config.enabled && config.url && config.key) {
      supabase = createClient(config.url, config.key);
    } else {
      supabase = null;
    }
  },

  init: () => {
    const config = StorageService.getCloudConfig();
    if (config.enabled && config.url && config.key) {
      try {
        supabase = createClient(config.url, config.key);
      } catch (e) {
        console.error("Failed to init supabase", e);
      }
    }
  },

  // --- Auth ---

  register: async (username: string, password: string): Promise<{ success: boolean; message?: string; confirmationRequired?: boolean }> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: username, 
          password: password,
          options: {
            emailRedirectTo: window.location.origin 
          }
        });
        
        if (error) return { success: false, message: error.message };
        
        if (data.user && !data.session) {
            return { success: true, confirmationRequired: true };
        }

        return { success: true };
      } catch (e: any) {
        return { success: false, message: e.message || 'Cloud registration failed' };
      }
    } else {
      const users = StorageService.getLocalUsers();
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already exists locally' };
      }
      
      const passwordHash = await StorageService.hashPassword(password);
      users.push({ username, passwordHash });
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      StorageService.saveLocalUserData(username, MOCK_ENTRIES_SEED);
      return { success: true };
    }
  },

  login: async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });
        if (error) return { success: false, message: error.message };
        
        localStorage.setItem(CURRENT_USER_KEY, username);
        return { success: true };
      } catch (e: any) {
        return { success: false, message: e.message || 'Cloud login failed' };
      }
    } else {
      const users = StorageService.getLocalUsers();
      const passwordHash = await StorageService.hashPassword(password);
      
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === passwordHash);
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, user.username);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials (Local)' };
    }
  },

  changePassword: async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUser) return { success: false, message: "Not authenticated" };

    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, message: error.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    } else {
      // Local
      const users = StorageService.getLocalUsers();
      const userIndex = users.findIndex(u => u.username === currentUser);
      if (userIndex === -1) return { success: false, message: "User not found" };

      const newHash = await StorageService.hashPassword(newPassword);
      users[userIndex].passwordHash = newHash;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return { success: true };
    }
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // "Deactivate" Account: Soft delete logic
  deactivateAccount: async (username: string): Promise<{ success: boolean; message?: string }> => {
    if (supabase) {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return { success: false, message: "Not authenticated" };

            // Instead of deleting the row, we update it with a deactivated status marker.
            // This effectively "wipes" the visible data but keeps the record as "disabled".
            const { error } = await supabase
              .from('user_data')
              .upsert({
                user_id: user.user.id,
                data: { status: "deactivated", deactivatedAt: new Date().toISOString() }
              });
            
            if (error) throw error;
            
            await supabase.auth.signOut();
            localStorage.removeItem(CURRENT_USER_KEY);
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    } else {
        // Local Soft Delete (Actually hard delete for local since we don't keep history)
        let users = StorageService.getLocalUsers();
        users = users.filter(u => u.username !== username);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.removeItem(DATA_PREFIX + username);
        localStorage.removeItem(CURRENT_USER_KEY);
        return { success: true };
    }
  },

  getCurrentUser: (): string | null => {
    return localStorage.getItem(CURRENT_USER_KEY);
  },

  // --- Data ---

  getUserData: async (username: string): Promise<Entry[]> => {
    if (supabase) {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return [];

        const { data, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', user.user.id)
          .maybeSingle();

        if (data && data.data) {
          // Check if it's the deactivated marker
          if (!Array.isArray(data.data) && (data.data as any).status === 'deactivated') {
             return [];
          }
          return Array.isArray(data.data) ? data.data : [];
        }
        return [];
      } catch (e) {
        console.error("Cloud fetch exception", e);
        return [];
      }
    } else {
      return StorageService.getLocalUserData(username);
    }
  },

  saveUserData: async (username: string, entries: Entry[]): Promise<{success: boolean, error?: any}> => {
    if (supabase) {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return { success: false, error: "No user logged in" };

        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: user.user.id,
            data: entries
          }, { onConflict: 'user_id' });
          
        if (error) {
            return { success: false, error };
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e };
      }
    } else {
      StorageService.saveLocalUserData(username, entries);
      return { success: true };
    }
  },

  clearUserData: async (username: string): Promise<{ success: boolean; message?: string }> => {
    return StorageService.saveUserData(username, []);
  },

  // --- Internal Local Helpers ---

  getLocalUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  getLocalUserData: (username: string): Entry[] => {
    const dataStr = localStorage.getItem(DATA_PREFIX + username);
    return dataStr ? JSON.parse(dataStr) : [];
  },

  saveLocalUserData: (username: string, entries: Entry[]) => {
    localStorage.setItem(DATA_PREFIX + username, JSON.stringify(entries));
  }
};

StorageService.init();