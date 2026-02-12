export interface Presets {
  categories: string[];
  styles: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  category: string;
  style: string;
  original_preview: string;
  optimized_preview: string;
}

export interface AppSettings {
  provider_mode: string;
  api_base_url?: string;
  model?: string;
}
