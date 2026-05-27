import { StockData, Recommendation } from '../types';

export function getRecommendation(stock: StockData): Recommendation {
  const { forwardPE, pegRatio, revenueGrowth } = stock;

  // 亏损或无数据
  if (forwardPE === null || forwardPE <= 0) {
    return {
      rating: 'avoid',
      label: '回避',
      color: '#ef4444',
      summary: '公司当前亏损或无法计算PE',
      score: 10,
    };
  }

  if (pegRatio === null) {
    // 没有 PEG 数据时只用 PE 判断
    if (forwardPE < 15) {
      return { rating: 'buy', label: '买入', color: '#22c55e', summary: `PE ${forwardPE.toFixed(1)}x，估值偏低，但缺少PEG数据`, score: 65 };
    } else if (forwardPE < 30) {
      return { rating: 'hold', label: '持有', color: '#eab308', summary: `PE ${forwardPE.toFixed(1)}x，估值合理，但缺少PEG数据`, score: 50 };
    } else if (forwardPE < 60) {
      return { rating: 'watch', label: '观望', color: '#f97316', summary: `PE ${forwardPE.toFixed(1)}x，估值偏高，缺少PEG数据`, score: 30 };
    }
    return { rating: 'avoid', label: '回避', color: '#ef4444', summary: `PE ${forwardPE.toFixed(1)}x，估值过高`, score: 10 };
  }

  // PEG 是核心评分指标
  const growth = (revenueGrowth ?? 0) * 100;

  if (pegRatio < 0.7 && forwardPE < 20) {
    return {
      rating: 'strong_buy',
      label: '强力买入',
      color: '#16a34a',
      summary: `PEG ${pegRatio.toFixed(2)} + ${forwardPE.toFixed(1)}x PE，增速 ${growth.toFixed(1)}%，严重低估`,
      score: 90,
    };
  }

  if (pegRatio < 1.0 && forwardPE < 30) {
    return {
      rating: 'buy',
      label: '买入',
      color: '#22c55e',
      summary: `PEG ${pegRatio.toFixed(2)} + ${forwardPE.toFixed(1)}x PE，增速 ${growth.toFixed(1)}%，估值偏低`,
      score: 75,
    };
  }

  if ((pegRatio >= 1.0 && pegRatio <= 1.5) || (forwardPE >= 30 && forwardPE <= 50)) {
    return {
      rating: 'hold',
      label: '持有',
      color: '#eab308',
      summary: `PEG ${pegRatio.toFixed(2)} + ${forwardPE.toFixed(1)}x PE，增速 ${growth.toFixed(1)}%，估值公允`,
      score: 50,
    };
  }

  if ((pegRatio > 1.5 && pegRatio <= 2.0) || (forwardPE > 50 && forwardPE <= 80)) {
    return {
      rating: 'watch',
      label: '观望',
      color: '#f97316',
      summary: `PEG ${pegRatio.toFixed(2)} + ${forwardPE.toFixed(1)}x PE，增速 ${growth.toFixed(1)}%，估值偏高`,
      score: 30,
    };
  }

  return {
    rating: 'avoid',
    label: '回避',
    color: '#ef4444',
    summary: `PEG ${pegRatio.toFixed(2)} + ${forwardPE.toFixed(1)}x PE，增速 ${growth.toFixed(1)}%，估值过高`,
    score: 10,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}
