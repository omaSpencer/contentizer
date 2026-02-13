import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Copy, RefreshCw, Settings2 } from 'lucide-react';
import { getPresets, hasApiKey, optimizeText, setApiKey } from '../tauri';
import type { Presets as PresetsType } from '../types';

const INPUT_MAX_CHARS = 4000;
const MAX_REGEN_COUNT = 3;
const COPY_FEEDBACK_MS = 2000;

export function Optimize() {
  const [presets, setPresets] = useState<PresetsType | null>(null);
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [text, setText] = useState('');
  const [lastInput, setLastInput] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [regenCount, setRegenCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    getPresets()
      .then((p) => {
        setPresets(p);
        if (p.categories.length) {
          setCategory((current) => current || p.categories[0]);
        }
        if (p.styles.length) {
          setStyle((current) => current || p.styles[0]);
        }
      })
      .catch(() => setError('Failed to load presets'));
  }, []);

  useEffect(() => {
    hasApiKey()
      .then((exists) => setIsApiKeyReady(exists))
      .catch(() => setApiKeyError('Failed to check API key state.'));
  }, []);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const runOptimize = useCallback(
    async (sourceText: string, isRegenerate = false) => {
      const trimmedText = sourceText.trim();
      if (!trimmedText) {
        setError('Enter some text to optimize.');
        return;
      }
      if (trimmedText.length > INPUT_MAX_CHARS) {
        setError(`Input is too long. Maximum ${INPUT_MAX_CHARS} characters.`);
        return;
      }
      if (isRegenerate && regenCount >= MAX_REGEN_COUNT) {
        setError(`Regenerate limit reached (${MAX_REGEN_COUNT}).`);
        return;
      }

      setError(null);
      setIsLoading(true);
      try {
        const result = await optimizeText(
          category,
          style,
          extraInstructions,
          trimmedText,
        );
        setLastInput(trimmedText);
        setText(result);
        setHasResult(true);
        setCopied(false);
        if (isRegenerate) {
          setRegenCount((current) => current + 1);
        } else {
          setRegenCount(0);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        if (message.toLowerCase().includes('api key')) {
          setIsApiKeyReady(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [category, style, extraInstructions, regenCount],
  );

  const handleOptimize = useCallback(() => {
    runOptimize(text, false);
  }, [runOptimize, text]);

  const handleRegenerate = useCallback(() => {
    runOptimize(lastInput || text, true);
  }, [lastInput, runOptimize, text]);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimerRef.current = null;
      }, COPY_FEEDBACK_MS);
    } catch {
      // clipboard can fail in some webview environments
    }
  }, [text]);

  const handleSaveApiKey = useCallback(async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setApiKeyError('API key is required.');
      return;
    }
    setApiKeyError(null);
    setIsSavingApiKey(true);
    try {
      await setApiKey(trimmed);
      setApiKeyInput('');
      setIsApiKeyReady(true);
    } catch (e) {
      setApiKeyError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSavingApiKey(false);
    }
  }, [apiKeyInput]);

  return (
    <div className='relative flex flex-col h-full min-h-0 p-4 gap-4'>
      <div className='flex justify-end'>
        <button
          type='button'
          onClick={() => setIsSettingsOpen((current) => !current)}
          className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
          aria-label='Open optimization settings'
          aria-expanded={isSettingsOpen}
        >
          <Settings2 className='h-5 w-5' />
        </button>
      </div>

      {isSettingsOpen && (
        <div className='absolute right-4 top-16 z-10 w-[min(320px,calc(100%-2rem))] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg'>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='category'
                className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
              >
                Category
              </label>
              <select
                id='category'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className='rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50'
              >
                {presets?.categories.length ? (
                  presets.categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                ) : (
                  <option value=''>Loading…</option>
                )}
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <label
                htmlFor='style'
                className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
              >
                Style
              </label>
              <select
                id='style'
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isLoading}
                className='rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50'
              >
                {presets?.styles.length ? (
                  presets.styles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))
                ) : (
                  <option value=''>Loading…</option>
                )}
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <label
                htmlFor='extra-instructions'
                className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
              >
                Extra instructions (optional)
              </label>
              <input
                id='extra-instructions'
                type='text'
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder='e.g. Keep it under 100 words'
                className='rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50'
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 relative'>
        <p className='absolute top-2 right-2 text-xs text-zinc-500 dark:text-zinc-400 text-right'>
          {text.length}/{INPUT_MAX_CHARS}
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (hasResult) {
              setHasResult(false);
              setRegenCount(0);
              setCopied(false);
            }
          }}
          placeholder={
            isLoading ? 'Optimizing…' : 'Paste or type your text here…'
          }
          className='h-full w-full min-h-[280px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70'
          disabled={isLoading}
          maxLength={INPUT_MAX_CHARS}
        />
      </div>

      <div className='flex flex-wrap gap-3 items-center justify-between'>
        <button
          type='button'
          onClick={handleOptimize}
          disabled={isLoading || !presets || !isApiKeyReady}
          className='px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors'
        >
          {isLoading ? 'Optimizing…' : 'Optimize'}
        </button>

        <div className='flex items-center gap-2'>
          {hasResult && (
            <>
              <button
                type='button'
                onClick={handleCopy}
                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
              >
                {copied ? (
                  <>
                    <Check className='h-4 w-4' />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className='h-4 w-4' />
                    Copy
                  </>
                )}
              </button>
              <button
                type='button'
                onClick={handleRegenerate}
                disabled={isLoading || regenCount >= MAX_REGEN_COUNT}
                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 disabled:pointer-events-none transition-colors'
              >
                <RefreshCw className='h-4 w-4' />
                Regen ({regenCount}/{MAX_REGEN_COUNT})
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className='text-sm text-red-600 dark:text-red-400' role='alert'>
          {error}
        </p>
      )}

      {!isApiKeyReady && (
        <div className='absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/50 p-4'>
          <div className='w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl space-y-3'>
            <h2 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
              Set API key
            </h2>
            <p className='text-sm text-zinc-600 dark:text-zinc-400'>
              First run setup: enter your OpenAI API key to continue.
            </p>
            <input
              type='password'
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder='sk-...'
              className='w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
              disabled={isSavingApiKey}
            />
            {apiKeyError && (
              <p className='text-sm text-red-600 dark:text-red-400' role='alert'>
                {apiKeyError}
              </p>
            )}
            <button
              type='button'
              onClick={handleSaveApiKey}
              disabled={isSavingApiKey}
              className='w-full px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors'
            >
              {isSavingApiKey ? 'Saving…' : 'Save API key'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
