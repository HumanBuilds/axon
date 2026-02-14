'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import type { ParsedCard } from '@/lib/anki/types';

type Step = 'select' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

interface DeckPreview {
  name: string;
  cards: ParsedCard[];
  selected: boolean;
}

interface ImportResult {
  deckName: string;
  deckId: string;
  cardCount: number;
}

interface ImportDeckButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ImportDeckButton({ className, children }: ImportDeckButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [deckPreviews, setDeckPreviews] = useState<DeckPreview[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = () => {
    setStep('select');
    setDeckPreviews([]);
    setWarnings([]);
    setResults([]);
    setErrorMessage('');
    setIsDragging(false);
  };

  const handleClose = () => {
    if (step === 'parsing' || step === 'importing') return;
    setIsOpen(false);
    if (step === 'done') {
      router.refresh();
    }
    setTimeout(reset, 300);
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.apkg')) {
      setErrorMessage('Please select an .apkg file');
      setStep('error');
      return;
    }

    setStep('parsing');

    try {
      const buffer = await file.arrayBuffer();
      const { parseApkg } = await import('@/lib/anki');
      const result = await parseApkg(buffer);

      if (result.decks.size === 0) {
        setErrorMessage('No cards found in this file');
        setStep('error');
        return;
      }

      const previews: DeckPreview[] = [];
      for (const [name, cards] of result.decks) {
        previews.push({ name, cards, selected: true });
      }

      setDeckPreviews(previews);
      setWarnings(result.warnings);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse .apkg file');
      setStep('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = async () => {
    const selectedDecks = deckPreviews.filter((d) => d.selected);
    if (selectedDecks.length === 0) return;

    setStep('importing');

    try {
      const payload = {
        decks: selectedDecks.map((d) => ({
          name: d.name,
          cards: d.cards.map((c) => ({
            front: c.front,
            back: c.back,
            tags: c.tags,
          })),
        })),
      };

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await res.json();
      setResults(data.results);
      setStep('done');
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed');
      setStep('error');
    }
  };

  const toggleDeck = (index: number) => {
    setDeckPreviews((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, selected: !d.selected } : d,
      ),
    );
  };

  const selectedCount = deckPreviews.filter((d) => d.selected).length;
  const totalCards = deckPreviews
    .filter((d) => d.selected)
    .reduce((sum, d) => sum + d.cards.length, 0);

  const modalTitle =
    step === 'select' ? 'Import Anki Deck' :
    step === 'parsing' ? 'Parsing...' :
    step === 'preview' ? 'Select Decks' :
    step === 'importing' ? 'Importing...' :
    step === 'done' ? 'Import Complete' :
    'Import Error';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || 'btn btn-outline px-8'}
      >
        {children || 'Import Anki Deck'}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={modalTitle}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        }
        footer={
          step === 'preview' ? (
            <>
              <span className="text-sm text-base-content/60">
                {selectedCount} deck(s), {totalCards} cards
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-primary-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  className="btn-primary"
                >
                  Import Selected
                </button>
              </div>
            </>
          ) : step === 'done' ? (
            <>
              <div />
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary"
              >
                Done
              </button>
            </>
          ) : step === 'error' ? (
            <>
              <div />
              <button
                type="button"
                onClick={reset}
                className="btn-primary"
              >
                Try Again
              </button>
            </>
          ) : undefined
        }
      >
        <div className="p-6">
          {/* Select Step */}
          {step === 'select' && (
            <div
              className={`border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300 hover:border-primary/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apkg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-base-content/30">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="font-bold mb-1">
                Drop your .apkg file here
              </p>
              <p className="text-sm text-base-content/60">
                or click to browse
              </p>
            </div>
          )}

          {/* Parsing Step */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="font-bold">Parsing Anki package...</p>
              <p className="text-sm text-base-content/60">This may take a moment for large decks</p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {warnings.length > 0 && (
                <div className="px-4 py-3 border-2 border-warning bg-warning/10 text-sm space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-warning-content">{w}</p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {deckPreviews.map((deck, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-colors ${
                      deck.selected
                        ? 'border-primary bg-primary/5'
                        : 'border-base-300 hover:border-base-content/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={deck.selected}
                      onChange={() => toggleDeck(i)}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{deck.name}</p>
                      <p className="text-xs text-base-content/60">
                        {deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="font-bold">Importing cards...</p>
              <p className="text-sm text-base-content/60">
                Creating {totalCards} cards across {selectedCount} deck(s)
              </p>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="font-bold text-lg">Import successful!</p>
              </div>

              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border-2 border-base-300"
                  >
                    <span className="font-bold text-sm truncate">{r.deckName}</span>
                    <span className="text-sm text-base-content/60">
                      {r.cardCount} card{r.cardCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="font-bold">Something went wrong</p>
              <p className="text-sm text-base-content/60 text-center">{errorMessage}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
