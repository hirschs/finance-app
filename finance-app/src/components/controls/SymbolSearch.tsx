import { useState } from 'react';
import type { FormEvent } from 'react';
import { isValidSymbol, normalizeSymbol } from '../../domain/symbol';

interface SymbolSearchProps {
  /** The symbol currently charted, or null when nothing is selected. */
  value: string | null;
  onSubmit: (symbol: string) => void;
  onClear: () => void;
}

/** One text box: type a ticker, press Enter. Malformed input is rejected here, before any request. */
export function SymbolSearch({ value, onSubmit, onClear }: SymbolSearchProps) {
  const [text, setText] = useState(value ?? '');
  const [problem, setProblem] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const symbol = normalizeSymbol(text);
    if (!isValidSymbol(symbol)) {
      setProblem(
        symbol === ''
          ? 'Enter a ticker symbol, for example AAPL.'
          : `"${symbol}" is not a valid ticker symbol. Use letters and digits, for example BRK-B.`,
      );
      return;
    }
    setProblem(null);
    setText(symbol);
    onSubmit(symbol);
  }

  function handleClear() {
    setText('');
    setProblem(null);
    onClear();
  }

  return (
    <form className="symbol-search" onSubmit={handleSubmit} role="search" aria-label="Company search">
      <label htmlFor="symbol-input">Compare another company</label>
      <div className="symbol-search-row">
        <input
          id="symbol-input"
          type="text"
          value={text}
          placeholder="Ticker, e.g. AAPL"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={problem !== null}
          aria-describedby={problem ? 'symbol-problem' : undefined}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Show chart</button>
        {value !== null && (
          <button type="button" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      {problem && (
        <p id="symbol-problem" role="alert" className="error">
          {problem}
        </p>
      )}
    </form>
  );
}
