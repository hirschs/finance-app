/** Names the companies whose data failed to load, so a missing line is never silent. */
export function FailedSymbolsNote({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return null;
  return (
    <p role="alert" className="error">
      No data for: {symbols.join(', ')}
    </p>
  );
}
