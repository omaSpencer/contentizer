import { useCallback } from 'react';

interface TextAreasProps {
  input: string;
  output: string;
  extraInstructions: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onExtraInstructionsChange: (value: string) => void;
  onClearInput?: () => void;
  onSwap?: () => void;
  outputDisabled?: boolean;
  isLoading?: boolean;
}

export function TextAreas({
  input,
  output,
  extraInstructions,
  onInputChange,
  onOutputChange,
  onExtraInstructionsChange,
  onClearInput,
  onSwap,
  outputDisabled = false,
  isLoading = false,
}: TextAreasProps) {
  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // Tauri clipboard plugin can be added later for guaranteed support
    }
  }, [output]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
      {/* Left: input */}
      <div className="flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Original text
          </label>
          {onClearInput && (
            <button
              type="button"
              onClick={onClearInput}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste or type your text here…"
          className="flex-1 min-h-[120px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isLoading}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Extra instructions (optional)
          </label>
          <input
            type="text"
            value={extraInstructions}
            onChange={(e) => onExtraInstructionsChange(e.target.value)}
            placeholder="e.g. Keep it under 100 words"
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Right: output */}
      <div className="flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Optimized text
          </label>
          <div className="flex items-center gap-2">
            {onSwap && (
              <button
                type="button"
                onClick={onSwap}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Swap
              </button>
            )}
            <button
              type="button"
              onClick={copyOutput}
              disabled={!output || outputDisabled}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
            >
              Copy
            </button>
          </div>
        </div>
        <textarea
          value={output}
          onChange={(e) => (outputDisabled ? undefined : onOutputChange(e.target.value))}
          placeholder={isLoading ? 'Optimizing…' : 'Result will appear here'}
          readOnly={outputDisabled}
          className="flex-1 min-h-[120px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
        />
      </div>
    </div>
  );
}
