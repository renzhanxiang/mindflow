import { EmotionType } from './types';
import { Smile, Frown, Meh, Flame, CloudLightning, Zap, Circle } from 'lucide-react';
import React from 'react';

export const EMOTION_CONFIG: Record<EmotionType, { label: string; color: string; icon: React.FC<any>; bg: string }> = {
  [EmotionType.JOY]: { label: 'Joy', color: '#fbbf24', icon: Smile, bg: 'bg-yellow-100' },
  [EmotionType.SADNESS]: { label: 'Sadness', color: '#60a5fa', icon: CloudLightning, bg: 'bg-blue-100' },
  [EmotionType.CALM]: { label: 'Calm', color: '#34d399', icon: Meh, bg: 'bg-emerald-100' },
  [EmotionType.ANGRY]: { label: 'Angry', color: '#f87171', icon: Flame, bg: 'bg-red-100' },
  [EmotionType.EXCITED]: { label: 'Excited', color: '#f472b6', icon: Zap, bg: 'bg-pink-100' },
  [EmotionType.ANXIOUS]: { label: 'Anxious', color: '#a78bfa', icon: Frown, bg: 'bg-purple-100' },
  [EmotionType.NEUTRAL]: { label: 'Neutral', color: '#94a3b8', icon: Circle, bg: 'bg-slate-100' },
};

export const MOCK_ENTRIES_SEED = [
  {
    id: '1',
    text: 'Had a breakthrough on the design project today! The colors finally clicked.',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    emotion: EmotionType.EXCITED,
    tags: ['Work', 'Design', 'Creativity'],
    category: 'Work'
  },
  {
    id: '2',
    text: 'Feeling a bit overwhelmed with the deadlines coming up next week. Need to breathe.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    emotion: EmotionType.ANXIOUS,
    tags: ['Work', 'Stress'],
    category: 'Work'
  },
  {
    id: '3',
    text: 'Morning coffee in the park. The birds are singing. Total peace.',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // 1 day and 2 hours ago
    emotion: EmotionType.CALM,
    tags: ['Life', 'Morning', 'Nature'],
    category: 'Life'
  },
  {
    id: '4',
    text: 'Why do we always want what we cannot have? It is a strange paradox of human nature.',
    timestamp: Date.now() - 1000 * 60 * 60 * 30, 
    emotion: EmotionType.NEUTRAL,
    tags: ['Philosophy', 'Question'],
    category: 'Philosophy'
  },
  {
    id: '5',
    text: 'Traffic was terrible, made me late for the meeting. So frustrating!',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    emotion: EmotionType.ANGRY,
    tags: ['Commute', 'Annoyance'],
    category: 'Life'
  },
  {
    id: '6',
    text: 'Family dinner was wonderful. Laughing with everyone made my week.',
    timestamp: Date.now() - 1000 * 60 * 60 * 52, // 2 days ago
    emotion: EmotionType.JOY,
    tags: ['Family', 'Dinner'],
    category: 'Social'
  }
];