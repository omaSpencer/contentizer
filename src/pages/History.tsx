import { useState, useEffect, useCallback } from 'react';
import { HistoryList } from '../components/HistoryList';
import { getHistory, clearHistory } from '../tauri';
import type { HistoryItem } from '../types';

export function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getHistory()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = useCallback(async () => {
    try {
      await clearHistory();
      setItems([]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 p-4">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        History
      </h1>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <HistoryList items={items} onClear={handleClear} />
      )}
    </div>
  );
}
