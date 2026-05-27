import React from 'react';
import { StockData } from '../types';
import { getRecommendation, getScoreColor } from '../engine/recommendation';
import { RecommendationBadge } from './RecommendationBadge';

interface Props {
  stock: StockData;
  onBack: () => void;
}

function fmt(n: number | null, suffix = '', decimals = 1): string {
  if (n === null || n === undefined) return '--';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(decimals) + suffix;
}

function fmtPrice(n: number, currency: string): string {
  const prefix = currency === 'KRW' ? '₩' : '$';
  if (n >= 10000) return prefix + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return prefix + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export const StockDetail: React.FC<Props> = ({ stock, onBack }) => {
  const rec = getRecommendation(stock);

  return (
    <div style={{ padding: '16px 16px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtn}>← 返回</button>
      </div>

      {/* 名称 + 价格 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', margin: 0, fontSize: 22 }}>{stock.name}</h2>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{stock.symbol} · {fmtPrice(stock.price, stock.currency)}</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <RecommendationBadge recommendation={rec} size="lg" />
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 10, lineHeight: 1.6, maxWidth: 400, margin: '10px auto 0' }}>
          {rec.summary}
        </p>
      </div>

      {/* 评分进度条 */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#94a3b8', fontSize: 12 }}>
          <span>综合评分</span>
          <span style={{ color: getScoreColor(rec.score), fontWeight: 700 }}>{rec.score}/100</span>
        </div>
        <div style={{ background: '#0f172a', borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${rec.score}%`, height: '100%', borderRadius: 6,
            background: `linear-gradient(90deg, ${getScoreColor(rec.score)}88, ${getScoreColor(rec.score)})`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* 指标网格 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16,
      }}>
        <DetailMetric label="Forward P/E" value={stock.forwardPE ? stock.forwardPE.toFixed(1) + 'x' : '--'} color="#60a5fa" />
        <DetailMetric label="Trailing P/E" value={stock.trailingPE ? stock.trailingPE.toFixed(1) + 'x' : '--'} color="#94a3b8" />
        <DetailMetric label="PEG Ratio" value={stock.pegRatio ? stock.pegRatio.toFixed(2) : '--'} color={!stock.pegRatio ? '#888' : stock.pegRatio < 1 ? '#4ade80' : '#fbbf24'} />
        <DetailMetric label="营收增速" value={fmt(stock.revenueGrowth, '%', 1)} color={!stock.revenueGrowth ? '#888' : stock.revenueGrowth > 0.3 ? '#4ade80' : '#fbbf24'} />
        <DetailMetric label="毛利率" value={fmt(stock.grossMargin, '%', 1)} color="#a78bfa" />
        <DetailMetric label="净利润率" value={fmt(stock.profitMargin, '%', 1)} color="#c084fc" />
        <DetailMetric label="52周最高" value={fmtPrice(stock.fiftyTwoWeekHigh ?? 0, stock.currency)} color="#f87171" />
        <DetailMetric label="52周最低" value={fmtPrice(stock.fiftyTwoWeekLow ?? 0, stock.currency)} color="#4ade80" />
      </div>

      {/* 说明 */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: 16,
        border: '1px solid #334155',
      }}>
        <h4 style={{ color: '#f1f5f9', margin: '0 0 8px', fontSize: 14 }}> 投资建议逻辑</h4>
        <ul style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li><strong style={{ color: '#4ade80' }}>强力买入</strong>：PEG &lt; 0.7 + PE &lt; 20x + 增速 &gt; 30%</li>
          <li><strong style={{ color: '#22c55e' }}>买入</strong>：PEG &lt; 1.0 + PE &lt; 30x</li>
          <li><strong style={{ color: '#eab308' }}>持有</strong>：PEG 1.0-1.5 或 PE 30-50x</li>
          <li><strong style={{ color: '#f97316' }}>观望</strong>：PEG 1.5-2.0 或 PE 50-80x</li>
          <li><strong style={{ color: '#ef4444' }}>回避</strong>：PEG &gt; 2.0 或 PE &gt; 80x</li>
        </ul>
      </div>
    </div>
  );
};

const DetailMetric: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ background: '#1e293b', borderRadius: 10, padding: '12px 14px' }}>
    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
  </div>
);

const backBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #334155',
  color: '#94a3b8',
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 14,
  cursor: 'pointer',
};
