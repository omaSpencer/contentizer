import type { HistoryItem } from '../types';

interface HistoryListProps {
  items: HistoryItem[];
  onClear: () => void;
  clearDisabled?: boolean;
}

export function HistoryList({ items, onClear, clearDisabled = false }: HistoryListProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Recent requests ({items.length})
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled || items.length === 0}
          className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
        >
          Clear history
        </button>
      </div>
      <ul className="flex-1 overflow-auto space-y-2 pr-2">
        {items.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
            No history yet. Optimize some text to see it here.
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm"
          >
            <div className="flex gap-2 mb-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.category}</span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">{item.style}</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 truncate" title={item.original_preview}>
              {item.original_preview}
            </p>
            <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 truncate" title={item.optimized_preview}>
              → {item.optimized_preview}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
