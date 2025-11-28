export enum EmotionType {
  JOY = 'JOY',
  SADNESS = 'SADNESS',
  CALM = 'CALM',
  ANGRY = 'ANGRY',
  EXCITED = 'EXCITED',
  ANXIOUS = 'ANXIOUS',
  NEUTRAL = 'NEUTRAL'
}

export interface Entry {
  id: string;
  text: string;
  timestamp: number; // Unix timestamp in ms
  emotion: EmotionType;
  tags: string[];
  category: string; // New field for classification (e.g., Work, Philosophy, Life)
  audioBase64?: string; // Optional: store the audio snippet
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface WordCloudItem {
  text: string;
  value: number;
}

export enum ViewMode {
  TIMELINE = 'TIMELINE',
  CALENDAR = 'CALENDAR',
  STATS = 'STATS'
}

export interface CloudConfig {
  url: string;
  key: string;
  enabled: boolean;
}