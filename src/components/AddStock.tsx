import React, { useState, useEffect, useRef } from 'react';
import { searchStock } from '../api/yahooFinance';
import { addToWatchlist } from '../store/watchlist';
import { WatchlistItem } from '../types';

// 常见股票代码快速添加
const POPULAR_STOCKS: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', addedAt: 0 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', addedAt: 0 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', addedAt: 0 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', addedAt: 0 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', addedAt: 0 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', addedAt: 0 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', addedAt: 0 },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', addedAt: 0 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', addedAt: 0 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', addedAt: 0 },
  { symbol: 'MU', name: 'Micron Technology', addedAt: 0 },
  { symbol: 'INTC', name: 'Intel Corporation', addedAt: 0 },
];

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export const AddStock: React.FC<Props> = ({ onDone, onCancel }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setSearchFailed(false);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchStock(query);
        setResults(res);
        setSearchFailed(res.length === 0);
      } catch {
        setResults([]);
        setSearchFailed(true);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleAdd = (symbol: string, name: string) => {
    const item: WatchlistItem = { symbol, name, addedAt: Date.now() };
    addToWatchlist(item);
    setAdded(symbol);
    setTimeout(() => { setAdded(null); onDone(); }, 600);
  };

  const handleDirectAdd = () => {
    const symbol = query.trim().toUpperCase();
    if (!symbol) return;
    handleAdd(symbol, symbol);
  };

  const isValidTicker = /^[A-Z0-9.]+$/i.test(query.trim()) && query.trim().length >= 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1e293b', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 500, maxHeight: '85vh',
        padding: '24px 20px 40px', overflow: 'auto',
      }}>
        <div style={{ width: 40, height: 4, background: '#475569', borderRadius: 2, margin: '0 auto 20px' }} />

        <h2 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: 18 }}>添加股票</h2>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="输入股票代码，如 AAPL、TSM、000660.KS…"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9',
            fontSize: 15, outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* 直接添加按钮 — 始终可用，浏览器搜索被 CORS 拦截时的兜底方案 */}
        {isValidTicker && results.length === 0 && !searching && (
          <button onClick={handleDirectAdd} style={{
            width: '100%', marginTop: 10, padding: '12px 14px', borderRadius: 10,
            background: '#2563eb', border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            直接添加 「{query.trim().toUpperCase()}」
          </button>
        )}

        {searching && (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>搜索中...</div>
        )}

        {searchFailed && !searching && query.length >= 2 && (
          <div style={{
            textAlign: 'center', padding: 12, color: '#eab308', fontSize: 12,
            background: '#42200622', borderRadius: 8, marginTop: 10,
          }}>
            {isValidTicker ? '未搜到结果，可直接添加代码' : '未搜到结果，请检查代码格式'}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {results.map(r => (
              <div key={r.symbol} onClick={() => handleAdd(r.symbol, r.name)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: 10,
                background: added === r.symbol ? '#166534' : '#0f172a',
                cursor: 'pointer', marginBottom: 6, border: '1px solid #1e293b',
              }}>
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{r.symbol}</div>
                </div>
                <span style={{
                  color: added === r.symbol ? '#4ade80' : '#64748b',
                  fontSize: 18, fontWeight: 700,
                }}>{added === r.symbol ? '✓' : '+'}</span>
              </div>
            ))}
          </div>
        )}

        {/* 常见股票快速添加 — 浏览器测试时最方便 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>常见股票 · 点击快速添加</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {POPULAR_STOCKS.map(s => (
              <button key={s.symbol} onClick={() => handleAdd(s.symbol, s.name)} style={{
                padding: '6px 12px', borderRadius: 8,
                background: '#0f172a', border: '1px solid #334155',
                color: '#94a3b8', fontSize: 11, cursor: 'pointer',
              }}>{s.symbol}</button>
            ))}
          </div>
        </div>

        <button onClick={onCancel} style={{
          width: '100%', padding: 14, borderRadius: 12,
          background: '#334155', border: 'none', color: '#94a3b8',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16,
        }}>取消</button>
      </div>
    </div>
  );
};
