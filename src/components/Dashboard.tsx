import React, { useState, useCallback, useEffect } from 'react';
import { StockData, WatchlistItem } from '../types';
import { useStockData } from '../hooks/useStockData';
import { loadWatchlist, removeFromWatchlist } from '../store/watchlist';
import { StockCard } from './StockCard';
import { StockDetail } from './StockDetail';
import { AddStock } from './AddStock';
import { getLastError } from '../api/yahooFinance';

export const Dashboard: React.FC = () => {
  const { stocks, loading, lastUpdate, error, refresh } = useStockData();
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [apiError, setApiError] = useState('');

  const updateWatchlist = useCallback(() => {
    setWatchlist(loadWatchlist());
  }, []);

  useEffect(() => {
    updateWatchlist();
    refresh();
  }, []);

  const handleRemove = (symbol: string) => {
    removeFromWatchlist(symbol);
    updateWatchlist();
    if (selectedStock?.symbol === symbol) setSelectedStock(null);
  };

  const handleRefresh = async () => {
    setApiError('');
    await refresh();
    const err = getLastError();
    if (err) setApiError(err);
  };

  const handleAddDone = () => {
    setShowAdd(false);
    updateWatchlist();
    handleRefresh();
  };

  const sorted = [...stocks].sort((a, b) => {
    const scoreA = a.pegRatio && a.pegRatio < 1 ? 100 - a.pegRatio * 100 : 0;
    const scoreB = b.pegRatio && b.pegRatio < 1 ? 100 - b.pegRatio * 100 : 0;
    return scoreB - scoreA;
  });

  if (selectedStock) {
    return <StockDetail stock={selectedStock} onBack={() => setSelectedStock(null)} />;
  }

  const timeStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: 22, fontWeight: 800 }}>
            股票估值追踪
            <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 6 }}>v1.0</span>
          </h1>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            更新于 {timeStr}
            {loading && <span style={{ marginLeft: 8, color: '#60a5fa' }}>刷新中…</span>}
            {error && <span style={{ marginLeft: 8, color: '#ef4444' }}>{error}</span>}
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading} style={iconBtn} title="刷新">
          🔄
        </button>
      </div>

      {/* API 错误提示 */}
      {apiError && (
        <div style={{
          background: '#7f1d1d', color: '#fca5a5', padding: '10px 14px',
          borderRadius: 10, marginBottom: 12, fontSize: 12,
          border: '1px solid #991b1b',
        }}>
          <strong>API 错误：</strong>{apiError}
        </div>
      )}

      {/* 空状态 */}
      {sorted.length === 0 && !loading && (
        <div style={{
          textAlign: 'center', padding: 60, color: '#64748b',
          background: '#1e293b', borderRadius: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, marginBottom: 4 }}>还没有关注股票</div>
          <div style={{ fontSize: 12 }}>点击下方按钮添加</div>
        </div>
      )}

      {/* 股票卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(stock => (
          <div key={stock.symbol} style={{ position: 'relative' }}>
            <StockCard stock={stock} onClick={() => setSelectedStock(stock)} />
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(stock.symbol); }}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(239,68,68,0.15)',
                border: 'none', color: '#ef4444',
                width: 28, height: 28, borderRadius: '50%',
                fontSize: 14, cursor: 'pointer', fontWeight: 700,
              }}
            >×</button>
          </div>
        ))}
      </div>

      {/* 加载骨架 */}
      {loading && sorted.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: '#1e293b', borderRadius: 14, padding: 20,
              height: 140, animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      )}

      {/* 添加按钮 */}
      <button onClick={() => setShowAdd(true)} style={{
        width: '100%', marginTop: 20, padding: 16,
        borderRadius: 14, border: '2px dashed #334155',
        background: 'transparent', color: '#64748b',
        fontSize: 16, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>+</span> 添加股票
      </button>

      <div style={{ textAlign: 'center', marginTop: 16, color: '#475569', fontSize: 10 }}>
        {watchlist.length} 只股票 · 数据来源 Yahoo Finance
      </div>

      {showAdd && <AddStock onDone={handleAddDone} onCancel={() => setShowAdd(false)} />}
    </div>
  );
};

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12,
  background: '#1e293b', border: '1px solid #334155',
  fontSize: 20, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
