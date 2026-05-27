import { WatchlistItem } from '../types';

const WATCHLIST_KEY = 'stock_watchlist';

export function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}

export function addToWatchlist(item: WatchlistItem): WatchlistItem[] {
  const list = loadWatchlist();
  if (list.find(i => i.symbol.toUpperCase() === item.symbol.toUpperCase())) return list;
  list.push(item);
  saveWatchlist(list);
  return list;
}

export function removeFromWatchlist(symbol: string): WatchlistItem[] {
  const list = loadWatchlist().filter(i => i.symbol.toUpperCase() !== symbol.toUpperCase());
  saveWatchlist(list);
  return list;
}
