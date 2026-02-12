import { invoke } from '@tauri-apps/api/core';
import type { HistoryItem, AppSettings, Presets } from './types';

export async function optimizeText(
  category: string,
  style: string,
  extraInstructions: string,
  originalText: string
): Promise<string> {
  return invoke<string>('optimize_text', {
    category,
    style,
    extraInstructions,
    originalText,
  });
}

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings');
}

export async function setSettings(settings: AppSettings): Promise<void> {
  return invoke('set_settings', { settings });
}

export async function getHistory(): Promise<HistoryItem[]> {
  return invoke<HistoryItem[]>('get_history');
}

export async function clearHistory(): Promise<void> {
  return invoke('clear_history');
}

export async function getPresets(): Promise<Presets> {
  return invoke<Presets>('get_presets');
}
