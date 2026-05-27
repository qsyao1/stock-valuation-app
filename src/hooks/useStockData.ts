import { useState, useCallback, useEffect, useRef } from 'react';
import { StockData, WatchlistItem } from '../types';
import { fetchMultiStocks, getCachedData } from '../api/yahooFinance';
import { loadWatchlist } from '../store/watchlist';

export function useStockData() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchlistRef = useRef<WatchlistItem[]>([]);

  // 启动时从缓存加载
  useEffect(() => {
    const items = loadWatchlist();
    const cached = items.map(i => getCachedData(i.symbol)).filter(Boolean) as StockData[];
    if (cached.length > 0) setStocks(cached);
    watchlistRef.current = items;
  }, []);

  const refresh = useCallback(async () => {
    const items = loadWatchlist();
    watchlistRef.current = items;
    if (items.length === 0) {
      setStocks([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const symbols = items.map(i => i.symbol);
      const data = await fetchMultiStocks(symbols);
      // 合并名称
      const merged = data.map(d => {
        const item = items.find(i => i.symbol.toUpperCase() === d.symbol.toUpperCase());
        if (item) d.name = item.name;
        return d;
      });
      setStocks(merged);
      setLastUpdate(Date.now());
    } catch (e: any) {
      setError(e.message ?? '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { stocks, loading, lastUpdate, error, refresh };
}
