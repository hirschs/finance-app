import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Quote } from '../../domain/types';
import { QuoteCard } from './QuoteCard';

const quote = (over: Partial<Quote> = {}): Quote => ({
  symbol: 'MSFT',
  name: 'Microsoft',
  currency: 'USD',
  price: 496.13,
  change: 3.63,
  changePct: 0.74,
  asOf: 0,
  ...over,
});

describe('QuoteCard', () => {
  it('shows symbol, company name, price, currency and a signed gain', () => {
    render(<QuoteCard quote={quote()} />);
    const card = screen.getByLabelText('Microsoft quote');
    expect(card).toHaveTextContent('MSFT');
    expect(card).toHaveTextContent('Microsoft');
    expect(card).toHaveTextContent('496.13');
    expect(card).toHaveTextContent('USD');
    expect(card).toHaveTextContent('+3.63 (+0.74%)');
    expect(card.querySelector('.up')).not.toBeNull();
  });

  it('shows a loss without a plus sign and styles it as down', () => {
    render(<QuoteCard quote={quote({ change: -4.18, changePct: -3.68 })} />);
    const card = screen.getByLabelText('Microsoft quote');
    expect(card).toHaveTextContent('-4.18 (-3.68%)');
    expect(card).not.toHaveTextContent('+');
    expect(card.querySelector('.down')).not.toBeNull();
  });

  it('highlights the focus company', () => {
    render(<QuoteCard quote={quote({ symbol: 'IBM', name: 'IBM' })} />);
    expect(screen.getByLabelText('IBM quote')).toHaveClass('focus');
  });

  it('does not repeat the ticker when the name equals the symbol', () => {
    render(<QuoteCard quote={quote({ symbol: 'IBM', name: 'IBM' })} />);
    expect(screen.getByRole('heading', { name: 'IBM' })).toHaveTextContent(/^IBM$/);
  });
});
