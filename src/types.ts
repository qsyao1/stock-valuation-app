export interface StockData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  forwardPE: number | null;
  trailingPE: number | null;
  pegRatio: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  profitMargin: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface Recommendation {
  rating: 'strong_buy' | 'buy' | 'hold' | 'watch' | 'avoid';
  label: string;
  color: string;
  summary: string;
  score: number; // 0-100
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

export interface CachedData {
  data: StockData;
  timestamp: number;
}
