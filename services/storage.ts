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
  password: string; // In a real app, hash this!
}

let supabase: SupabaseClient | null = null;

export const StorageService = {
  // --- Configuration ---

  getCloudConfig: (): CloudConfig => {
    const str = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (str) {
      return JSON.parse(str);
    }
    // Default to provided credentials if no local config exists
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
          email: username, // Treating username as email for Supabase
          password: password,
          options: {
            // CRITICAL: Ensure the email link redirects to the current deployed URL, not localhost
            emailRedirectTo: window.location.origin 
          }
        });
        
        if (error) return { success: false, message: error.message };
        
        // If session is missing but user is present, email confirmation is likely required
        if (data.user && !data.session) {
            return { success: true, confirmationRequired: true };
        }

        // Create initial entry to ensure user exists in our flow or just return success
        // Auto-login is usually handled by the client but let's just return success
        return { success: true };
      } catch (e: any) {
        return { success: false, message: e.message || 'Cloud registration failed' };
      }
    } else {
      // Local Fallback
      const users = StorageService.getLocalUsers();
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already exists locally' };
      }
      users.push({ username, password });
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
        
        localStorage.setItem(CURRENT_USER_KEY, username); // Store email as current user
        return { success: true };
      } catch (e: any) {
        return { success: false, message: e.message || 'Cloud login failed' };
      }
    } else {
      // Local Fallback
      const users = StorageService.getLocalUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, user.username);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials (Local)' };
    }
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(CURRENT_USER_KEY);
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

        // Query the 'user_data' table (single row per user)
        const { data, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', user.user.id)
          .maybeSingle();

        if (error) {
            // Ignore error if it's just "no rows found", otherwise log it
            if (error.code !== 'PGRST116') {
               console.error("Cloud fetch error", error);
            }
            return [];
        }
        
        if (data && data.data) {
          // If 'data' is the JSON column containing the array
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

        // Save all entries as a single JSON blob into the 'user_data' table
        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: user.user.id,
            data: entries
          }, { onConflict: 'user_id' }); // Upsert based on user_id unique constraint
          
        if (error) {
            console.error("Cloud save error", error);
            return { success: false, error };
        }
        return { success: true };
      } catch (e) {
        console.error("Cloud save exception", e);
        return { success: false, error: e };
      }
    } else {
      StorageService.saveLocalUserData(username, entries);
      return { success: true };
    }
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

// Initialize on load
StorageService.init();