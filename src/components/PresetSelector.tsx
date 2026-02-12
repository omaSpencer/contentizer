import type { Presets } from '../types';

interface PresetSelectorProps {
  presets: Presets | null;
  category: string;
  style: string;
  onCategoryChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  disabled?: boolean;
}

export function PresetSelector({
  presets,
  category,
  style,
  onCategoryChange,
  onStyleChange,
  disabled = false,
}: PresetSelectorProps) {
  const categories = presets?.categories ?? [];
  const styles = presets?.styles ?? [];

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2">
        <label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {categories.length === 0 && (
            <option value="">Loading…</option>
          )}
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="style" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Style
        </label>
        <select
          id="style"
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {styles.length === 0 && (
            <option value="">Loading…</option>
          )}
          {styles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
