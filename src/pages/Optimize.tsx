import { useState, useEffect, useCallback } from 'react';
import { PresetSelector } from '../components/PresetSelector';
import { TextAreas } from '../components/TextAreas';
import { HistoryList } from '../components/HistoryList';
import { getPresets, optimizeText, getHistory, clearHistory } from '../tauri';
import type { Presets as PresetsType, HistoryItem } from '../types';

export function Optimize() {
  const [presets, setPresets] = useState<PresetsType | null>(null);
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getPresets()
      .then((p) => {
        setPresets(p);
        if (p.categories.length && !category) setCategory(p.categories[0]);
        if (p.styles.length && !style) setStyle(p.styles[0]);
      })
      .catch(() => setError('Failed to load presets'));
  }, []);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  const runOptimize = useCallback(async () => {
    const text = input.trim();
    if (!text) {
      setError('Enter some text to optimize.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await optimizeText(category, style, extraInstructions, text);
      setOutput(result);
      getHistory().then(setHistory);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [category, style, extraInstructions, input]);

  const handleClearInput = useCallback(() => {
    setInput('');
    setError(null);
  }, []);

  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput(input);
  }, [input, output]);

  const handleClearHistory = useCallback(async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-4">
      <PresetSelector
        presets={presets}
        category={category}
        style={style}
        onCategoryChange={setCategory}
        onStyleChange={setStyle}
        disabled={isLoading}
      />

      <TextAreas
        input={input}
        output={output}
        extraInstructions={extraInstructions}
        onInputChange={setInput}
        onOutputChange={setOutput}
        onExtraInstructionsChange={setExtraInstructions}
        onClearInput={handleClearInput}
        onSwap={handleSwap}
        outputDisabled={false}
        isLoading={isLoading}
      />

      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={runOptimize}
          disabled={isLoading || !presets}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {isLoading ? 'Optimizing…' : 'Optimize'}
        </button>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 flex-1 min-h-[180px]">
        <HistoryList
          items={history}
          onClear={handleClearHistory}
          clearDisabled={isLoading}
        />
      </div>
    </div>
  );
}
