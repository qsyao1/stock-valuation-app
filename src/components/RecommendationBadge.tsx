import React from 'react';
import { Recommendation } from '../types';
import { getScoreColor } from '../engine/recommendation';

interface Props {
  recommendation: Recommendation;
  size?: 'sm' | 'md' | 'lg';
}

export const RecommendationBadge: React.FC<Props> = ({ recommendation, size = 'md' }) => {
  const fontSize = size === 'lg' ? '15px' : size === 'sm' ? '11px' : '13px';
  const padding = size === 'lg' ? '8px 18px' : size === 'sm' ? '3px 10px' : '5px 14px';
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding,
      borderRadius: 20,
      backgroundColor: `${recommendation.color}18`,
      border: `1.5px solid ${recommendation.color}`,
      fontSize,
      fontWeight: 700,
      color: recommendation.color,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: recommendation.color,
        boxShadow: `0 0 6px ${recommendation.color}`,
      }} />
      {recommendation.label}
      <span style={{ fontSize: '0.85em', opacity: 0.7, marginLeft: 2 }}>
        {recommendation.score}分
      </span>
    </div>
  );
};
