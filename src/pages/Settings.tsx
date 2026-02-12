import { useState, useEffect, useCallback } from 'react';
import { getSettings, setSettings } from '../tauri';
import type { AppSettings } from '../types';

export function Settings() {
  const [settings, setSettingsState] = useState<AppSettings>({
    provider_mode: 'env',
    api_base_url: '',
    model: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettingsState)
      .catch(() => setError('Failed to load settings'));
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    setSaved(false);
    try {
      await setSettings(settings);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [settings]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState((s) => ({ ...s, [key]: value }));
  }, []);

  return (
    <div className="max-w-lg p-4 space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        Settings
      </h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Settings saved.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            API key mode
          </label>
          <select
            value={settings.provider_mode}
            onChange={(e) => update('provider_mode', e.target.value)}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="env">Environment variable (dev)</option>
            <option value="keychain">Keychain (macOS)</option>
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {settings.provider_mode === 'env'
              ? 'Set CONTENTIZER_API_KEY in your environment. The key is never stored in the app.'
              : 'Keychain mode stores the key securely on macOS. Not yet implemented—use env for now.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            API base URL (optional)
          </label>
          <input
            type="url"
            value={settings.api_base_url ?? ''}
            onChange={(e) => update('api_base_url', e.target.value || undefined)}
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Leave empty for OpenAI. Use for local or proxy endpoints.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Model (optional)
          </label>
          <input
            type="text"
            value={settings.model ?? ''}
            onChange={(e) => update('model', e.target.value || undefined)}
            placeholder="gpt-4o-mini"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
