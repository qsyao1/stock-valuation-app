import React from 'react';
import { StockData } from '../types';
import { getRecommendation } from '../engine/recommendation';
import { RecommendationBadge } from './RecommendationBadge';

interface Props {
  stock: StockData;
  onClick: () => void;
}

function fmt(n: number | null, suffix = '', decimals = 1): string {
  if (n === null || n === undefined) return '--';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(decimals) + suffix;
}

function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtMarketCap(n: number | null): string {
  if (!n) return '--';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

export const StockCard: React.FC<Props> = ({ stock, onClick }) => {
  const rec = getRecommendation(stock);
  const pegColor = !stock.pegRatio ? '#888' : stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 1.5 ? '#eab308' : '#ef4444';
  const peColor = !stock.forwardPE ? '#888' : stock.forwardPE < 20 ? '#22c55e' : stock.forwardPE < 30 ? '#eab308' : stock.forwardPE < 50 ? '#f97316' : '#ef4444';
  const growthColor = !stock.revenueGrowth ? '#888' : stock.revenueGrowth > 0.3 ? '#22c55e' : stock.revenueGrowth > 0.15 ? '#eab308' : '#f97316';

  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: 14,
      padding: '16px 18px',
      cursor: 'pointer',
      border: '1px solid #1e293b',
      transition: 'border-color 0.2s',
    }}>
      {/* 顶部：名称 + 价格 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{stock.name}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{stock.symbol}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
            {stock.currency === 'KRW' ? '₩' : '$'}{fmtPrice(stock.price)}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{fmtMarketCap(stock.marketCap)}</div>
        </div>
      </div>

      {/* 四格指标 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        marginBottom: 10,
      }}>
        <div style={metricBox}>
          <div style={{ ...metricVal, color: peColor }}>{stock.forwardPE ? stock.forwardPE.toFixed(1) + 'x' : '--'}</div>
          <div style={metricLabel}>Forward P/E</div>
        </div>
        <div style={metricBox}>
          <div style={{ ...metricVal, color: pegColor }}>{stock.pegRatio ? stock.pegRatio.toFixed(2) : '--'}</div>
          <div style={metricLabel}>PEG</div>
        </div>
        <div style={metricBox}>
          <div style={{ ...metricVal, color: growthColor }}>{fmt(stock.revenueGrowth, '%', 1)}</div>
          <div style={metricLabel}>营收增速</div>
        </div>
        <div style={metricBox}>
          <div style={{ ...metricVal, color: '#e2e8f0' }}>{fmt(stock.grossMargin, '%', 1)}</div>
          <div style={metricLabel}>毛利率</div>
        </div>
      </div>

      {/* 建议 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <RecommendationBadge recommendation={rec} size="sm" />
        <span style={{ fontSize: 10, color: '#64748b' }}>点击详情 →</span>
      </div>
    </div>
  );
};

const metricBox: React.CSSProperties = {
  background: '#0f172a',
  borderRadius: 8,
  padding: '6px 4px',
  textAlign: 'center',
};

const metricVal: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
};

const metricLabel: React.CSSProperties = {
  fontSize: 9,
  color: '#64748b',
  marginTop: 2,
};
